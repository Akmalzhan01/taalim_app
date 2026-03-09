import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import type { AppDispatch, RootState } from '../app/store';
import { LayoutDashboard, ShoppingCart, Users, BookOpen, LogOut, Grid, Quote, MessageSquare, Share2, ChartCandlestick, Menu, X, Settings, Barcode, PieChart, LayoutList, ReceiptText, Package, UserPlus, PackageOpen, Store } from 'lucide-react';

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

    const [openCategories, setOpenCategories] = useState<string[]>(['main', 'sales']);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const navCategories = [
        {
            id: 'main',
            label: 'Главное',
            items: [
                { id: 'dashboard', label: 'Обзор', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
                { id: 'pos', label: 'Касса (POS)', path: '/dashboard/pos', icon: <ChartCandlestick size={18} />, className: 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 hover:text-emerald-800' },
                { id: 'reports', label: 'Отчеты', path: '/dashboard/reports', icon: <PieChart size={18} /> },
            ]
        },
        {
            id: 'sales',
            label: 'Продажи & Закупки',
            items: [
                { id: 'orders', label: 'Заказы', path: '/dashboard/orders', icon: <ShoppingCart size={18} /> },
                { id: 'supplies', label: 'Закупка', path: '/dashboard/supplies', icon: <Package size={18} /> },
                { id: 'suppliers', label: 'Поставщики (Долги)', path: '/dashboard/suppliers', icon: <PackageOpen size={18} />, className: 'text-orange-600 bg-orange-50/50 hover:bg-orange-100 hover:text-orange-800' },
                { id: 'expenses', label: 'Расходы', path: '/dashboard/expenses', icon: <ReceiptText size={18} />, className: 'text-rose-600 hover:bg-rose-50' },
            ]
        },
        {
            id: 'catalog',
            label: 'Каталог',
            items: [
                { id: 'books', label: 'Книги', path: '/dashboard/books', icon: <BookOpen size={18} /> },
                { id: 'categories', label: 'Категории', path: '/dashboard/categories', icon: <Grid size={18} /> },
                { id: 'barcodes', label: 'Штрих-коды', path: '/dashboard/barcodes', icon: <Barcode size={18} /> },
            ]
        },
        {
            id: 'crm',
            label: 'Люди & CRM',
            items: [
                { id: 'customers', label: 'Клиенты (CRM)', path: '/dashboard/customers', icon: <UserPlus size={18} />, className: 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-800' },
                { id: 'users', label: 'Пользователи / Персонал', path: '/dashboard/users', icon: <Users size={18} /> },
                { id: 'kanban', label: 'Канбан (Задачи)', path: '/dashboard/kanban', icon: <LayoutList size={18} /> },
            ]
        },
        {
            id: 'content',
            label: 'Контент & Настройки',
            items: [
                { id: 'banners', label: 'Баннеры', path: '/dashboard/banners', icon: <LayoutDashboard size={18} /> },
                { id: 'quotes', label: 'Цитаты', path: '/dashboard/quotes', icon: <Quote size={18} /> },
                { id: 'blogs', label: 'Блог', path: '/dashboard/blogs', icon: <MessageSquare size={18} /> },
                { id: 'links', label: 'Соц. сети', path: '/dashboard/links', icon: <Share2 size={18} /> },
                { id: 'branches', label: 'Филиалы', path: '/dashboard/branches', icon: <Store size={18} /> },
                { id: 'settings', label: 'Настройки', path: '/dashboard/settings', icon: <Settings size={18} /> },
            ]
        }
    ];

    // Filter categories based on user permissions
    const filteredCategories = navCategories.map(category => ({
        ...category,
        items: category.items.filter(item => hasPermission(item.id))
    })).filter(category => category.items.length > 0);

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
            {/* Minimalist Sidebar */}
            <aside className={`bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[280px] translate-x-0 opacity-100 shrink-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <BookOpen className="text-white h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">Taalim Admin</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 pb-6 overflow-y-auto custom-scrollbar">
                    {filteredCategories.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCategories.map((category) => {
                                const isOpen = openCategories.includes(category.id);
                                return (
                                    <div key={category.id} className="flex flex-col">
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className="flex items-center justify-between px-2 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors cursor-pointer w-full text-left focus:outline-none"
                                        >
                                            <span>{category.label}</span>
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <div className={`space-y-1 mt-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {category.items.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    to={item.path}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group focus:outline-none ${item.className || 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus:bg-indigo-50 focus:text-indigo-700'
                                                        }`}
                                                >
                                                    <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                                                        {item.icon}
                                                    </span>
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
