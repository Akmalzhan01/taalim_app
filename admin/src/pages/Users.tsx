import { useEffect, useState } from 'react';
import { Trash2, Edit, UserPlus, X, User as UserIcon, Mail, Lock, Shield, Store, Check, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers, deleteUser, adminCreateUser, reset } from '../features/users/userSlice';
import { getBranches } from '../features/branches/branchSlice';
import { Link } from 'react-router-dom';
import type { AppDispatch, RootState } from '../app/store';
import BranchFilter from '../components/BranchFilter';

const Users = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { users, isLoading, isSuccess } = useSelector((state: RootState) => state.userList);
    const { branches, selectedBranch } = useSelector((state: RootState) => state.branches);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
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
        dispatch(getUsers(selectedBranch));
        dispatch(getBranches());
    }, [dispatch, selectedBranch]);

    useEffect(() => {
        if (isSuccess && isModalOpen) {
            setIsModalOpen(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'cashier',
                branch: '',
                isAdmin: false,
                permissions: []
            });
            dispatch(reset());
        }
    }, [isSuccess, isModalOpen, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
            dispatch(deleteUser(id));
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(adminCreateUser(formData));
    };

    const handlePermissionChange = (moduleId: string) => {
        setFormData(prev => {
            const isChecked = prev.permissions.includes(moduleId);
            if (isChecked) {
                return { ...prev, permissions: prev.permissions.filter(id => id !== moduleId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, moduleId] };
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Пользователи</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление пользователями и правами доступа</p>
                </div>
                <div className="flex items-center gap-3">
                    <BranchFilter />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-200"
                    >
                        <UserPlus size={18} /> Добавить пользователя
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Пользователь</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Роль</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата регистрации</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 font-medium">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full uppercase tracking-wider border ${user.role === 'superadmin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                            user.role === 'manager' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {user.role === 'superadmin' ? 'SuperAdmin' :
                                                user.role === 'manager' ? 'Manager' : 'Cashier'}
                                        </span>
                                        {(user as any).branch && (
                                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                                                {user?.branch?.name || (user?.branch && typeof user.branch === 'object' ? (user.branch as any).name : 'Центральный')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link to={`/dashboard/users/${user._id}/edit`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors" title="Редактировать">
                                            <Edit size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Удалить"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !isLoading && (
                    <div className="p-10 text-center text-slate-500">Пользователи не найдены</div>
                )}
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Новый пользователь</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Создайте аккаунт и назначьте права</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Имя</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Роль</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="superadmin">SuperAdmin</option>
                                            <option value="manager">Manager</option>
                                            <option value="cashier">Cashier</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Филиал</label>
                                    <div className="relative group">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <select
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="">Без филиала</option>
                                            {branches.map((b: any) => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={formData.isAdmin}
                                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                />
                                <label htmlFor="isAdmin" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Системный администратор (Full Access)
                                </label>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 block">Доступ к модулям</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                                    {modules.map((mod) => (
                                        <label key={mod.id} className="flex items-center gap-2 cursor-pointer group hover:bg-white p-1.5 rounded-lg transition-all">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(mod.id) || formData.isAdmin}
                                                disabled={formData.isAdmin}
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm mb-4"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-all text-sm mb-4 shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
