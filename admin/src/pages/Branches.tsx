import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBranches, createBranch, updateBranch, deleteBranch, reset as resetBranches } from '../features/branches/branchSlice';
import { adminCreateUser, getUsers, updateUser, deleteUser, reset as resetUsers } from '../features/users/userSlice';
import { Plus, Trash2, Edit2, X, MapPin, Phone, Building2, Check, Loader2, UserPlus, Mail, Lock, Shield, User as UserIcon } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';

const Branches = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { branches, isLoading, isError, message } = useSelector(
        (state: RootState) => state.branches
    );
    const userList = useSelector((state: RootState) => state.userList as any);
    const { user } = useSelector((state: RootState) => state.auth);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [staffEditMode, setStaffEditMode] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        isActive: true,
    });

    const [staffFormData, setStaffFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        branch: '',
        isAdmin: false,
        permissions: [] as string[]
    });

    const modules = [
        { id: 'dashboard', name: 'Обзор' },
        { id: 'orders', name: 'Заказы' },
        { id: 'books', name: 'Книги' },
        { id: 'pos', name: 'Касса' },
        { id: 'barcodes', name: 'Штрих-коды' },
        { id: 'banners', name: 'Баннеры' },
        { id: 'categories', name: 'Категории' },
        { id: 'users', name: 'Пользователи' },
        { id: 'settings', name: 'Настройки' },
        { id: 'branches', name: 'Филиалы' },
        { id: 'supplies', name: 'Закупки' },
        { id: 'reports', name: 'Отчеты' },
        { id: 'expenses', name: 'Расходы' },
        { id: 'kanban', name: 'Канбан' },
        { id: 'quotes', name: 'Цитаты' },
        { id: 'blogs', name: 'Блог' },
        { id: 'links', name: 'Соц. сети' },
    ];

    useEffect(() => {
        dispatch(getBranches());
        dispatch(getUsers());
        return () => {
            dispatch(resetBranches());
            dispatch(resetUsers());
        };
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            alert(message);
        }
    }, [isError, message]);

    useEffect(() => {
        if (userList.isSuccess && isStaffModalOpen) {
            const messageStr = staffEditMode ? 'Сотрудник успешно обновлен' : 'Сотрудник успешно добавлен';
            setIsStaffModalOpen(false);
            setStaffFormData({
                name: '',
                email: '',
                password: '',
                role: 'cashier',
                branch: '',
                isAdmin: false,
                permissions: []
            });
            setStaffEditMode(false);
            setSelectedStaffId(null);
            dispatch(resetUsers());
            dispatch(getUsers());
            alert(messageStr);
        }
    }, [userList.isSuccess, isStaffModalOpen, dispatch, staffEditMode]);

    const handleDelete = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот филиал?')) {
            dispatch(deleteBranch(id));
        }
    };

    const handleEdit = (branch: any) => {
        setFormData({
            name: branch.name,
            address: branch.address || '',
            phone: branch.phone || '',
            isActive: branch.isActive,
        });
        setSelectedId(branch._id);
        setEditMode(true);
        setIsModalOpen(true);
    };

    const handleAddStaff = (branch: any) => {
        setStaffFormData({
            name: '',
            email: '',
            password: '',
            role: 'cashier',
            branch: branch._id,
            isAdmin: false,
            permissions: []
        });
        setStaffEditMode(false);
        setSelectedStaffId(null);
        setIsStaffModalOpen(true);
    };

    const handleEditStaff = (staff: any, branch: any) => {
        setStaffFormData({
            name: staff.name,
            email: staff.email,
            password: '', // Blank unless they want to change it
            role: staff.role,
            branch: branch._id,
            isAdmin: staff.isAdmin || false,
            permissions: staff.permissions || []
        });
        setSelectedStaffId(staff._id);
        setStaffEditMode(true);
        setIsStaffModalOpen(true);
    };

    const handleDeleteStaff = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            dispatch(deleteUser(id)).then(() => {
                dispatch(getUsers()); // Refresh UI instantly
            });
        }
    };

    const handleOpenModal = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            isActive: true,
        });
        setEditMode(false);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editMode && selectedId) {
            dispatch(updateBranch({ id: selectedId, branchData: formData }));
        } else {
            dispatch(createBranch(formData));
        }
        setIsModalOpen(false);
    };

    const handleStaffSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (staffEditMode && selectedStaffId) {
            dispatch(updateUser({ _id: selectedStaffId, ...staffFormData }));
        } else {
            dispatch(adminCreateUser(staffFormData));
        }
    };

    const handlePermissionChange = (moduleId: string) => {
        setStaffFormData(prev => {
            const isChecked = prev.permissions.includes(moduleId);
            if (isChecked) {
                return { ...prev, permissions: prev.permissions.filter(id => id !== moduleId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, moduleId] };
            }
        });
    };

    if (isLoading && branches.length === 0) return <div className="p-8 text-center text-slate-500">Загрузка...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Филиалы</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление точками продаж и складами</p>
                </div>
                {(user?.role === 'superadmin' || user?.isAdmin) && (
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm"
                    >
                        <Plus size={18} /> Добавить филиал
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch: any) => (
                    <div key={branch._id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <Building2 size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${branch.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {branch.isActive ? 'Активен' : 'Неактивен'}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight">{branch.name}</h3>
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin size={16} />
                                        <span>{branch.address || 'Адрес не указан'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Phone size={16} />
                                        <span>{branch.phone || 'Телефон не указан'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ----------- STAFF DISPLAY ----------- */}
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Сотрудники ({userList.users?.filter((u: any) => (u.branch?._id || u.branch) === branch._id).length || 0})
                                </h4>
                                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                    {userList.users?.filter((u: any) => (u.branch?._id || u.branch) === branch._id).map((staff: any) => (
                                        <div key={staff._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/50 group/staff">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                    {staff.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]" title={staff.name}>{staff.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1.5 opacity-0 group-hover/staff:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditStaff(staff, branch)} className="text-slate-400 hover:text-indigo-600 p-1" title="Редактировать"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDeleteStaff(staff._id)} className="text-slate-400 hover:text-rose-600 p-1" title="Удалить"><Trash2 size={14} /></button>
                                                </div>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                                                    {staff.role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* --------------------------------------- */}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleAddStaff(branch)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-[11px] font-bold uppercase tracking-tight"
                                title="Добавить сотрудника"
                            >
                                <UserPlus size={14} /> Сотрудник
                            </button>
                            <button
                                onClick={() => handleEdit(branch)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(branch._id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {branches.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Building2 size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">Филиалы не найдены</p>
                        <button onClick={handleOpenModal} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">
                            Создать первый филиал
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        <div className="bg-white rounded-3xl w-full max-w-lg p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">{editMode ? 'Редактировать филиал' : 'Новый филиал'}</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Название филиала</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 text-sm font-medium"
                                        required
                                        placeholder="Например: Главный офис / Филиал Коканд"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Адрес</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 text-sm font-medium"
                                        placeholder="Улица, дом, ориентир..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-2">Телефон</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 text-sm font-medium"
                                        placeholder="+998 90 123 45 67"
                                    />
                                </div>

                                <div className="flex items-center gap-2 py-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 font-bold">Активен</label>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all text-sm mt-4 flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    {editMode ? 'Сохранить изменения' : 'Создать филиал'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Staff Creation Modal */}
            {
                isStaffModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsStaffModalOpen(false)}></div>
                        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{staffEditMode ? 'Изменить данные сотрудника' : 'Новый сотрудник'}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Для филиала: <span className="text-indigo-600 font-bold">{(branches.find((b: any) => b._id === staffFormData.branch) as any)?.name}</span>
                                    </p>
                                </div>
                                <button onClick={() => setIsStaffModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Имя</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={staffFormData.name}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={staffFormData.email}
                                                onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                placeholder="example@mail.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Пароль</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input
                                            type={staffEditMode ? "text" : "password"}
                                            required={!staffEditMode}
                                            value={staffFormData.password}
                                            onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                            placeholder={staffEditMode ? "Оставьте пустым, если не меняется" : "••••••••"}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Роль сотрудника</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select
                                            value={staffFormData.role}
                                            onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="manager">Manager (Управляющий филиалом)</option>
                                            <option value="cashier">Cashier (Продавец-кассир)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Доступ к модулям</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                                        {modules.map((mod) => (
                                            <label key={mod.id} className="flex items-center gap-2 cursor-pointer group hover:bg-white p-1.5 rounded-lg transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={staffFormData.permissions.includes(mod.id) || staffFormData.isAdmin}
                                                    disabled={staffFormData.isAdmin}
                                                    onChange={() => handlePermissionChange(mod.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                                />
                                                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{mod.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsStaffModalOpen(false)}
                                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm mb-4"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={userList.isLoading}
                                        className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:bg-indigo-700 transition-all text-sm mb-4 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                                    >
                                        {userList.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                        {staffEditMode ? 'Сохранить изменения' : 'Добавить в штат'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Branches;
