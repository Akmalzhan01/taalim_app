import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Save, Loader, AlertCircle } from 'lucide-react';
import { getUserDetails, updateUser, reset } from '../features/users/userSlice';
import { getBranches } from '../features/branches/branchSlice';
import type { AppDispatch, RootState } from '../app/store';

const UserEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.userList as any
    );

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState<'superadmin' | 'manager' | 'cashier'>('cashier');
    const [branch, setBranch] = useState('');
    const [password, setPassword] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);

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

    const { branches } = useSelector((state: RootState) => state.branches);

    useEffect(() => {
        dispatch(getBranches());
    }, [dispatch]);

    useEffect(() => {
        if (isSuccess) {
            dispatch(reset());
        }

        if (!user.name || user._id !== id) {
            if (id) dispatch(getUserDetails(id));
        } else {
            setName(user.name);
            setEmail(user.email);
            setIsAdmin(user.isAdmin);
            setRole(user.role || 'cashier');
            setBranch(user.branch?._id || user.branch || '');
            setPermissions(user.permissions || []);
        }
    }, [dispatch, id, user, isSuccess]);

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(updateUser({ _id: id, name, email, isAdmin, role, branch, password, permissions }));
        navigate('/dashboard/users');
    };

    const handlePermissionChange = (moduleId: string) => {
        const isChecked = permissions.includes(moduleId);
        if (isChecked) {
            setPermissions(permissions.filter(id => id !== moduleId));
        } else {
            setPermissions([...permissions, moduleId]);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link
                    to="/dashboard/users"
                    className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Редактирование пользователя
                    </h2>
                    <p className="text-slate-500 text-sm">Измените данные пользователя</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading && (
                    <div className="flex justify-center py-10">
                        <Loader className="animate-spin text-slate-400" />
                    </div>
                )}

                {isError && (
                    <div className="m-6 p-4 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-2 text-sm border border-rose-100">
                        <AlertCircle size={16} />
                        {message}
                    </div>
                )}

                {!isLoading && (
                    <form onSubmit={submitHandler} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    placeholder="Введите имя"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email адрес
                                </label>
                                <input
                                    type="email"
                                    placeholder="Введите email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Новый пароль
                                </label>
                                <input
                                    type="password"
                                    placeholder="Оставьте пустым, чтобы не менять"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Заполняйте только если хотите изменить пароль
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Роль
                                    </label>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    >
                                        <option value="superadmin">SuperAdmin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Филиал
                                    </label>
                                    <select
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                    >
                                        <option value="">Без филиала</option>
                                        {branches.map((b: any) => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={isAdmin}
                                    onChange={(e) => setIsAdmin(e.target.checked)}
                                    className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="isAdmin" className="text-sm font-medium text-slate-700 select-none cursor-pointer font-bold">
                                    Системный администратор (isAdmin)
                                </label>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <label className="text-sm font-bold text-slate-500 uppercase block">Доступ к модулям</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {modules.map((mod) => (
                                        <label key={mod.id} className="flex items-center gap-2 cursor-pointer group hover:bg-white p-1.5 rounded-lg transition-all">
                                            <input
                                                type="checkbox"
                                                checked={permissions.includes(mod.id) || isAdmin}
                                                disabled={isAdmin}
                                                onChange={() => handlePermissionChange(mod.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                            />
                                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{mod.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                            >
                                <Save size={18} />
                                Сохранить
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserEdit;
