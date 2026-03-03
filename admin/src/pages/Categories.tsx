import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCategories, createCategory, deleteCategory, updateCategory, reset } from '../features/categories/categorySlice';
import { Plus, Trash2, Edit2, X, Check, BookOpen, Briefcase, Smile, GraduationCap, Users, Clock, Palette, Monitor, Heart, Globe, Coffee, Music, Camera, Code, Database, Cpu } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';

// Map string names to Lucide components
const ICON_MAP: any = {
    'book-open': BookOpen,
    'briefcase': Briefcase,
    'smile': Smile,
    'graduation-cap': GraduationCap,
    'users': Users,
    'clock': Clock,
    'palette': Palette,
    'monitor': Monitor,
    'heart': Heart,
    'globe': Globe,
    'coffee': Coffee,
    'music': Music,
    'camera': Camera,
    'code': Code,
    'database': Database,
    'cpu': Cpu
};

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C',
    '#2E294E', '#D4A5A5', '#3399FF', '#6C5DD3', '#FF4C4C'
];

const Categories = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { categories, isLoading, isError, message } = useSelector(
        (state: RootState) => state.categories
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        icon: 'book-open',
        color: '#6C5DD3',
    });

    useEffect(() => {
        if (isError) {
            alert(message);
        }
        dispatch(getCategories());
        return () => { dispatch(reset()); };
    }, [isError, message, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            dispatch(deleteCategory(id));
        }
    };

    const handleEdit = (category: any) => {
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
        });
        setSelectedId(category._id);
        setEditMode(true);
        setIsModalOpen(true);
    };

    const handleOpenModal = () => {
        setFormData({
            name: '',
            icon: 'book-open',
            color: '#6C5DD3',
        });
        setEditMode(false);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode && selectedId) {
            dispatch(updateCategory({ id: selectedId, categoryData: formData }));
        } else {
            dispatch(createCategory(formData));
        }
        setIsModalOpen(false);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Загрузка...</div>;

    const SelectedIcon = ICON_MAP[formData.icon] || BookOpen;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Категории</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление жанрами и категориями книг</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm"
                >
                    <Plus size={18} /> Добавить категорию
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category: any) => {
                    const CatIcon = ICON_MAP[category.icon] || BookOpen;
                    return (
                        <div key={category._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <CatIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{category.name}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{category.icon}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(category)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(category._id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">{editMode ? 'Редактировать категорию' : 'Новая категория'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Preview */}
                            <div className="flex justify-center mb-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors duration-300"
                                        style={{ backgroundColor: formData.color }}
                                    >
                                        <SelectedIcon size={40} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{formData.name || 'Название'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Название</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium"
                                    required
                                    placeholder="Например: Фантастика"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Цвет</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color })}
                                            className={`h-10 rounded-xl transition-all flex items-center justify-center ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-105' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {formData.color === color && <Check size={16} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Иконка</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                    {Object.keys(ICON_MAP).map(iconName => {
                                        const Icon = ICON_MAP[iconName];
                                        const isSelected = formData.icon === iconName;
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: iconName })}
                                                className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                            >
                                                <Icon size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all text-sm mt-4">
                                {editMode ? 'Сохранить изменения' : 'Создать категорию'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
