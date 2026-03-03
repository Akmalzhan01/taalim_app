import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTasks, createTask, updateTask, deleteTask, reorderTasks, setOptimisticTasks } from '../features/tasks/taskSlice';
import { getKanbanColumns, createKanbanColumn, updateKanbanColumn, deleteKanbanColumn, reorderKanbanColumns } from '../features/kanbanColumns/kanbanColumnSlice';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Trash2, Edit2, Calendar, Columns } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import BranchFilter from '../components/BranchFilter';

const Kanban = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks } = useSelector((state: RootState) => state.tasks);
    const { columns: dbColumns } = useSelector((state: RootState) => state.kanbanColumns);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    // Internal state mapping columnId -> { title, color, items }
    const [columns, setColumns] = useState<any>({});

    // Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

    // Edit tracking
    const [editTask, setEditTask] = useState<any>(null);
    const [editColumn, setEditColumn] = useState<any>(null);

    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        status: '',
        priority: 'medium',
        dueDate: ''
    });

    const [colFormData, setColFormData] = useState({
        title: '',
        color: 'slate'
    });

    useEffect(() => {
        dispatch(getKanbanColumns(selectedBranch));
        dispatch(getTasks(selectedBranch));
    }, [dispatch, selectedBranch]);

    useEffect(() => {
        if (dbColumns && tasks) {
            const newCols: any = {};

            // 1. Initialize empty columns based on db order
            if (Array.isArray(dbColumns)) {
                [...dbColumns]
                    .filter(col => col && col._id)
                    .sort((a: any, b: any) => a.order - b.order)
                    .forEach(col => {
                        newCols[col._id] = { title: col.title, color: col.color, items: [] };
                    });
            }

            // 2. Distribute tasks into columns
            const sortedTasks = [...tasks].sort((a: any, b: any) => a.order - b.order);
            sortedTasks.forEach((task: any) => {
                const statusStr = String(task.status);
                // If the column exists, push it
                if (newCols[statusStr]) {
                    newCols[statusStr].items.push(task as never);
                }
            });

            setColumns(newCols);
        }
    }, [tasks, dbColumns]);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, type } = result;

        if (type === 'column') {
            // Reordering columns
            const newCols = [...dbColumns].sort((a: any, b: any) => a.order - b.order);
            const [removed] = newCols.splice(source.index, 1);
            newCols.splice(destination.index, 0, removed);

            const updatedCols = newCols.map((col: any, index: number) => ({
                id: col._id,
                order: index
            }));

            // We should ideally dispatch an optimistic reorder here or just call the API
            dispatch(reorderKanbanColumns(updatedCols));
            // To update UI instantly, we update the redux state
            const updatedReduxCols = newCols.map((col: any, index: number) => ({ ...col, order: index }));
            dispatch({ type: 'kanbanColumn/setOptimisticColumns', payload: updatedReduxCols });
            return;
        }

        if (source.droppableId !== destination.droppableId) {
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const removed = { ...sourceItems.splice(source.index, 1)[0] };

            // Update status string to match destination column _id
            removed.status = destination.droppableId;
            destItems.splice(destination.index, 0, removed);

            // Re-calculate orders within array
            const updatedMovingItems = destItems.map((item: any, index: number) => ({ ...item, order: index }));
            const updatedSourceItems = sourceItems.map((item: any, index: number) => ({ ...item, order: index }));

            setColumns({
                ...columns,
                [source.droppableId]: { ...sourceColumn, items: updatedSourceItems },
                [destination.droppableId]: { ...destColumn, items: updatedMovingItems }
            });

            // Optimistic Update Array for Redux
            const unchangedItems = tasks.filter((i: any) => String(i.status) !== source.droppableId && String(i.status) !== destination.droppableId);
            const allItems = [
                ...unchangedItems,
                ...updatedSourceItems,
                ...updatedMovingItems
            ];

            dispatch(setOptimisticTasks(allItems));

            // Api payload
            const payload = updatedMovingItems.map((i: any) => ({ id: i._id, status: i.status, order: i.order }));
            dispatch(reorderTasks(payload));

        } else {
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);

            const updatedItems = copiedItems.map((item: any, index: number) => ({ ...item, order: index }));

            setColumns({
                ...columns,
                [source.droppableId]: { ...column, items: updatedItems }
            });

            const allItems = tasks.map(t => {
                const updated = updatedItems.find(u => u._id === t._id);
                return updated ? updated : t;
            });
            dispatch(setOptimisticTasks(allItems));

            const payload = updatedItems.map((i: any) => ({ id: i._id, status: i.status, order: i.order }));
            dispatch(reorderTasks(payload));
        }
    };

    // --- Task Handlers ---

    const handleOpenTaskModal = (status = '', task: any = null) => {
        // If status empty, use first column available
        const defaultStatus = status || (dbColumns.length > 0 ? dbColumns[0]._id : '');

        if (task) {
            setEditTask(task);
            setTaskFormData({
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
            });
        } else {
            setEditTask(null);
            setTaskFormData({
                title: '',
                description: '',
                status: defaultStatus,
                priority: 'medium',
                dueDate: ''
            });
        }
        setIsTaskModalOpen(true);
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editTask) {
            dispatch(updateTask({ id: editTask._id, ...taskFormData }));
        } else {
            dispatch(createTask(taskFormData));
        }
        setIsTaskModalOpen(false);
    };

    const handleTaskDelete = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
            dispatch(deleteTask(id));
        }
    };

    // --- Column Handlers ---

    const handleOpenColModal = (column: any = null) => {
        if (column) {
            setEditColumn(column);
            setColFormData({
                title: column.title,
                color: column.color || 'slate'
            });
        } else {
            setEditColumn(null);
            setColFormData({
                title: '',
                color: 'slate'
            });
        }
        setIsColumnModalOpen(true);
    };

    const handleColSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editColumn) {
            dispatch(updateKanbanColumn({ id: editColumn._id, ...colFormData }));
        } else {
            dispatch(createKanbanColumn(colFormData));
        }
        setIsColumnModalOpen(false);
    };

    const handleColDelete = (id: string, itemLen: number) => {
        if (itemLen > 0) {
            if (!window.confirm(`В этой колонке есть задачи (${itemLen}). При удалении колонки все задачи в ней также будут удалены. Вы точно уверены?`)) return;
        } else {
            if (!window.confirm('Удалить пустую колонку?')) return;
        }
        dispatch(deleteKanbanColumn(id));
    };

    // --- Styling Helpers ---

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100/80 shadow-sm shadow-rose-100/50';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100/80 shadow-sm shadow-amber-100/50';
            case 'low': return 'bg-emerald-50 text-emerald-600 border-emerald-100/80 shadow-sm shadow-emerald-100/50';
            default: return 'bg-slate-50 text-slate-600 border-slate-100 shadow-sm shadow-slate-100/50';
        }
    };

    const getColumnStyle = (colorMode: string) => {
        switch (colorMode) {
            case 'indigo': return 'border-t-4 border-t-indigo-400';
            case 'amber': return 'border-t-4 border-t-amber-400';
            case 'emerald': return 'border-t-4 border-t-emerald-400';
            case 'rose': return 'border-t-4 border-t-rose-400';
            case 'blue': return 'border-t-4 border-t-blue-400';
            default: return 'border-t-4 border-t-slate-400';
        }
    };

    const getColumnHeaderBg = (colorMode: string) => {
        switch (colorMode) {
            case 'indigo': return 'bg-indigo-50/40 text-indigo-900';
            case 'amber': return 'bg-amber-50/40 text-amber-900';
            case 'emerald': return 'bg-emerald-50/40 text-emerald-900';
            case 'rose': return 'bg-rose-50/40 text-rose-900';
            case 'blue': return 'bg-blue-50/40 text-blue-900';
            default: return 'bg-slate-50/40 text-slate-900';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 h-full flex flex-col relative z-0">
            {/* Background Blob for aesthetics */}
            <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-20 left-10 -z-10 w-72 h-72 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <div>
                    <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 tracking-tight">Канбан Доска</h2>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">Эффективное управление задачами магазина</p>
                </div>
                <div className="flex items-center gap-3">
                    <BranchFilter />
                    <button
                        onClick={() => handleOpenColModal()}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm"
                    >
                        <Columns size={18} />
                        Новая колонка
                    </button>
                    <button
                        onClick={() => handleOpenTaskModal()}
                        disabled={dbColumns.length === 0}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_25px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} className="stroke-[2.5px]" />
                        Новая задача
                    </button>
                </div>
            </div>

            {(!Array.isArray(dbColumns) || dbColumns.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200 border-dashed">
                    <Columns size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Нет колонок</h3>
                    <p className="text-slate-500 mt-2 mb-6 text-center max-w-md">Добавьте свою первую колонку (например: "В планах", "В работе"), чтобы начать управлять задачами.</p>
                    <button
                        onClick={() => handleOpenColModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-md font-bold transition-all shadow-md hove:shadow-lg"
                    >
                        Добавить колонку
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="all-columns" direction="horizontal" type="column">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex gap-6 h-full min-h-[650px] min-w-max px-2"
                                >
                                    {/* Render columns exactly in the order defined by dbColumns */}
                                    {Array.isArray(dbColumns) && [...dbColumns].filter(col => col && col._id).sort((a: any, b: any) => a.order - b.order).map((dbCol: any, index: number) => {
                                        const columnId = dbCol._id;
                                        const column = columns[columnId];
                                        if (!column) return null; // Wait for state to sync

                                        return (
                                            <Draggable key={columnId || `col-${index}`} draggableId={String(columnId || `col-${index}`)} index={index}>
                                                {(colProvided, colSnapshot) => (
                                                    <div
                                                        ref={colProvided.innerRef}
                                                        {...colProvided.draggableProps}
                                                        className={`w-[360px] flex flex-col bg-slate-50/90 rounded-[1.5rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 ${getColumnStyle(column.color)} ${colSnapshot.isDragging ? 'rotate-2 scale-105 z-50 shadow-xl' : ''}`}
                                                    >
                                                        <div
                                                            {...colProvided.dragHandleProps}
                                                            className={`px-5 py-4 flex items-center justify-between border-b border-white/50 rounded-t-[1.5rem] ${getColumnHeaderBg(column.color)} group/colheader cursor-grab active:cursor-grabbing hover:bg-opacity-80 transition-all`}
                                                        >
                                                            <h3 className="font-bold flex items-center gap-2.5 text-base tracking-tight select-none">
                                                                <GripVertical size={16} className="text-slate-400 opacity-50 group-hover/colheader:opacity-100" />
                                                                {column.title}
                                                                <span className="bg-white/80 text-slate-600 text-[11px] px-2.5 py-0.5 rounded-full border border-slate-200/50 shadow-sm font-bold min-w-[24px] text-center">
                                                                    {column.items.length}
                                                                </span>
                                                            </h3>
                                                            <div className="flex gap-1 opacity-0 group-hover/colheader:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleOpenColModal(dbCol)}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-[0_0_0_transparent] hover:shadow-sm"
                                                                    title="Редактировать колонку"
                                                                >
                                                                    <Edit2 size={16} className="stroke-[2.5px]" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleColDelete(columnId, column.items.length)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-[0_0_0_transparent] hover:shadow-sm"
                                                                    title="Удалить колонку"
                                                                >
                                                                    <Trash2 size={16} className="stroke-[2.5px]" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <Droppable droppableId={String(columnId)} type="task">
                                                            {(provided: any, snapshot: any) => (
                                                                <div
                                                                    {...provided.droppableProps}
                                                                    ref={provided.innerRef}
                                                                    className={`flex-1 p-4 space-y-4 overflow-y-auto transition-colors duration-300 scrollbar-hide ${snapshot.isDraggingOver ? 'bg-indigo-50/40' : ''}`}
                                                                >
                                                                    {column.items.map((item: any, index: number) => (
                                                                        <Draggable key={item._id || `task-${item.id}-${index}`} draggableId={String(item._id || item.id)} index={index}>
                                                                            {(provided: any, snapshot: any) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    style={provided.draggableProps.style}
                                                                                    className={snapshot.isDragging ? "z-50 relative" : ""}
                                                                                >
                                                                                    <div
                                                                                        className={`bg-white p-5 rounded-2xl border ${snapshot.isDragging ? 'border-indigo-400 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] scale-[1.03] rotate-1 ring-2 ring-indigo-100/50' : 'border-slate-100/80 hover:border-indigo-200/60 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_25px_-8px_rgba(99,102,241,0.15)] hover:-translate-y-0.5'
                                                                                            } transition-all duration-300 group relative`}
                                                                                    >
                                                                                        <div className="flex items-start gap-3 mb-3">
                                                                                            <div {...provided.dragHandleProps} className="flex-shrink-0 text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing transition-colors p-1 -ml-2 rounded-lg hover:bg-indigo-50">
                                                                                                <GripVertical size={16} />
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0 pr-8">
                                                                                                <h4 className="text-[15px] font-bold text-slate-800 leading-snug break-words group-hover:text-indigo-900 transition-colors">{item.title}</h4>
                                                                                                {item.description && (
                                                                                                    <p className="text-[13px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="pl-7 flex items-center justify-between mt-5">
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                <span className={`text-[10px] uppercase font-bold px-2 py-1 flex items-center gap-1 rounded-md border ${getPriorityColor(item.priority)}`}>
                                                                                                    {item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий'}
                                                                                                </span>
                                                                                                {item.dueDate && (
                                                                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-100 shadow-sm shadow-slate-100/50">
                                                                                                        <Calendar size={12} className="text-indigo-400" />
                                                                                                        {new Date(item.dueDate).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Actions overlay */}
                                                                                        <div className="absolute top-4 right-4 flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                                                                            <button
                                                                                                onClick={() => handleOpenTaskModal(item.status, item)}
                                                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-indigo-100 bg-white"
                                                                                            >
                                                                                                <Edit2 size={14} className="stroke-[2.5px]" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleTaskDelete(item._id)}
                                                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow-md border border-transparent hover:border-rose-100 bg-white"
                                                                                            >
                                                                                                <Trash2 size={14} className="stroke-[2.5px]" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                    <button
                                                                        onClick={() => handleOpenTaskModal(columnId)}
                                                                        className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                                                    >
                                                                        <Plus size={16} /> Добавить
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            )}

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editTask ? 'Редактировать задачу' : 'Новая задача'}
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Название задачи *</label>
                                <input
                                    type="text"
                                    required
                                    value={taskFormData.title}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Например: Обновить баннеры"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Описание</label>
                                <textarea
                                    value={taskFormData.description}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24"
                                    placeholder="Подробности задачи..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Статус (Колонка)</label>
                                    <select
                                        value={taskFormData.status}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                                    >
                                        {Array.isArray(dbColumns) && dbColumns.filter(col => col && col._id).map(col => (
                                            <option key={col._id} value={col._id}>{col.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Приоритет</label>
                                    <select
                                        value={taskFormData.priority}
                                        onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                                    >
                                        <option value="low">Низкий</option>
                                        <option value="medium">Средний</option>
                                        <option value="high">Высокий</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Крайний срок</label>
                                <input
                                    type="date"
                                    value={taskFormData.dueDate}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Column Modal */}
            {isColumnModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editColumn ? 'Редактировать колонку' : 'Новая колонка'}
                            </h3>
                            <button onClick={() => setIsColumnModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleColSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Название колонки *</label>
                                <input
                                    type="text"
                                    required
                                    value={colFormData.title}
                                    onChange={(e) => setColFormData({ ...colFormData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Например: В планах"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Цветовая тема</label>
                                <select
                                    value={colFormData.color}
                                    onChange={(e) => setColFormData({ ...colFormData, color: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                                >
                                    <option value="slate">Обычный (Серый)</option>
                                    <option value="indigo">Основной (Индиго)</option>
                                    <option value="amber">В процессе (Янтарный)</option>
                                    <option value="emerald">Готово (Изумрудный)</option>
                                    <option value="blue">Информация (Синий)</option>
                                    <option value="rose">Срочно (Розовый)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsColumnModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Kanban;
