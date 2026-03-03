import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import type { AppDispatch, RootState } from '../app/store';
import { LayoutDashboard, ShoppingCart, Users, BookOpen, LogOut, Grid, Quote, MessageSquare, Share2, ChartCandlestick, Menu, X, Settings, Barcode, PieChart, LayoutList, ReceiptText, Package } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    const hasPermission = (permissionId: string) => {
        if (!user) return false;

        // Superadmin bypass: checking both role and isAdmin (for compatibility)
        const isAdminUser =
            user.role === 'superadmin' ||
            user.isAdmin === true ||
            (user.isAdmin as any) === 'true';

        if (isAdminUser) return true;

        // Dynamic permission check
        return Array.isArray(user.permissions) && user.permissions.includes(permissionId);
    };

    const navItems = [
        { id: 'dashboard', label: 'Обзор', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'orders', label: 'Заказы', path: '/dashboard/orders', icon: <ShoppingCart size={20} /> },
        { id: 'books', label: 'Книги', path: '/dashboard/books', icon: <BookOpen size={20} /> },
        { id: 'pos', label: 'Касса (POS)', path: '/dashboard/pos', icon: <ChartCandlestick size={20} />, className: 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-800' },
        { id: 'barcodes', label: 'Штрих-коды', path: '/dashboard/barcodes', icon: <Barcode size={20} /> },
        { id: 'banners', label: 'Баннеры', path: '/dashboard/banners', icon: <LayoutDashboard size={20} /> },
        { id: 'categories', label: 'Категории', path: '/dashboard/categories', icon: <Grid size={20} /> },
        { id: 'users', label: 'Пользователи', path: '/dashboard/users', icon: <Users size={20} /> },
        { id: 'quotes', label: 'Цитаты', path: '/dashboard/quotes', icon: <Quote size={20} /> },
        { id: 'blogs', label: 'Блог', path: '/dashboard/blogs', icon: <MessageSquare size={20} /> },
        { id: 'links', label: 'Соц. сети', path: '/dashboard/links', icon: <Share2 size={20} /> },
        { id: 'supplies', label: 'Закупка', path: '/dashboard/supplies', icon: <Package size={20} /> },
        { id: 'reports', label: 'Отчеты', path: '/dashboard/reports', icon: <PieChart size={20} /> },
        { id: 'kanban', label: 'Канбан', path: '/dashboard/kanban', icon: <LayoutList size={20} /> },
        { id: 'expenses', label: 'Расходы', path: '/dashboard/expenses', icon: <ReceiptText size={20} />, className: 'text-rose-600 hover:bg-rose-50' },
        { id: 'settings', label: 'Настройки', path: '/dashboard/settings', icon: <Settings size={20} /> },
        { id: 'branches', label: 'Филиалы', path: '/dashboard/branches', icon: <Grid size={20} /> },
    ];

    const filteredNavItems = navItems.filter(item => hasPermission(item.id));

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
            {/* Minimalist Sidebar */}
            <aside className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                <div className="p-8 pb-6 min-w-[18rem]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <BookOpen className="text-white h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">Taalim Admin</h1>
                    </div>
                </div>

                <nav className="mt-4 flex-1 px-4 space-y-1.5 min-w-[18rem] overflow-y-auto">
                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">ГЛАВНОЕ МЕНЮ</p>

                    {filteredNavItems.length > 0 ? (
                        filteredNavItems.map((item) => (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group focus:outline-none ${item.className || 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:bg-indigo-50 focus:text-indigo-700'
                                    }`}
                            >
                                <span className="group-hover:stroke-slate-900 transition-colors">
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 italic">
                            Нет доступных модулей
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 min-w-[18rem]">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium text-sm">Выйти</span>
                    </button>
                    <div className="mt-4 px-4 text-xs text-slate-400 text-center">
                        Taalim v1.0.0
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
                {/* Glass Header */}
                <header className="flex justify-between items-center py-4 px-8 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 transition-all">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Обзор системы</h2>
                            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
                                Добро пожаловать, {user?.name || 'Администратор'}
                                {user && (
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter">
                                        {user.role} {user.isAdmin ? '(Admin)' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm ring-1 ring-slate-100 cursor-pointer hover:ring-indigo-200 transition-all uppercase">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC] p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
