import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats, getTopBooks, getSalesChart, getSalesByDate, clearSelectedDateSales } from '../features/reports/reportSlice';
import { getBranches } from '../features/branches/branchSlice';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BookOpen, ShoppingBag, Banknote, RefreshCcw, CalendarRange, ArrowUpRight, ArrowDownRight, X, Loader2, Store } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';

const Reports = () => {
    const dispatch = useDispatch<AppDispatch>();

    const {
        dashboardStats,
        topBooks,
        leastBooks,
        salesChart,
        selectedDateSales,
        isLoading
    } = useSelector((state: RootState) => state.reports);

    const { user } = useSelector((state: RootState) => state.auth);
    const { branches } = useSelector((state: RootState) => state.branches);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Default to user's branch if not superadmin
    const [selectedBranch, setSelectedBranch] = useState<string>(
        user?.role !== 'superadmin' && !user?.isAdmin ? ((user?.branch as any)?._id || (user?.branch as any) || '') : ''
    );

    useEffect(() => {
        dispatch(getBranches());
    }, [dispatch]);

    useEffect(() => {
        const filters = { startDate: undefined, endDate: undefined, branch: selectedBranch };
        dispatch(getDashboardStats(filters));
        dispatch(getTopBooks(filters));
        dispatch(getSalesChart(filters));
    }, [dispatch, selectedBranch]);

    const handleApplyFilter = () => {
        const filters = { startDate, endDate, branch: selectedBranch };
        dispatch(getDashboardStats(filters));
        dispatch(getTopBooks(filters));
        dispatch(getSalesChart(filters));
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        const filters = { startDate: undefined, endDate: undefined, branch: selectedBranch };
        dispatch(getDashboardStats(filters));
        dispatch(getTopBooks(filters));
        dispatch(getSalesChart(filters));
    };

    const handleRowClick = (date: string) => {
        setSelectedDateModal(date);
        dispatch(getSalesByDate({ date }));
    };

    const closeDateModal = () => {
        setSelectedDateModal(null);
        dispatch(clearSelectedDateSales());
    };

    if (isLoading && !dashboardStats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCcw className="animate-spin" size={32} />
                    <p className="font-medium animate-pulse">Загрузка аналитики...</p>
                </div>
            </div>
        );
    }

    const {
        totalRevenue,
        posRevenue,
        mobileRevenue,
        totalCOGS,
        totalSupplies,
        netProfit,
        totalRefunds,
        totalExpenditures,
        totalCashbackIssued,
        totalCashbackUsed,
        booksSold,
        totalOrders
    } = dashboardStats || {};

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Аналитика и Отчеты</h2>
                    <p className="text-slate-500 text-sm mt-1">Ключевые показатели эффективности магазина</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 px-3">
                        <CalendarRange size={16} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent outline-none cursor-pointer"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent outline-none cursor-pointer"
                        />
                    </div>
                    <div className="hidden md:block h-6 w-px bg-slate-200"></div>

                    {(user?.role === 'superadmin' || user?.isAdmin) ? (
                        <div className="flex items-center gap-2 px-3">
                            <Store size={16} className="text-slate-400" />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent outline-none cursor-pointer font-bold"
                            >
                                <option value="">Все филиалы</option>
                                {branches && Array.isArray(branches) && branches.map((b: any) => (
                                    <option key={b._id} value={b._id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : user?.branch && (
                        <div className="flex items-center gap-2 px-3 text-indigo-600 font-bold text-sm">
                            <Store size={16} />
                            <span>{user.branch.name || 'Ваш филиал'}</span>
                        </div>
                    )}

                    <div className="hidden md:block h-6 w-px bg-slate-200"></div>
                    <button
                        onClick={handleApplyFilter}
                        className="px-4 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors w-full md:w-auto"
                    >
                        Применить
                    </button>
                    {(startDate || endDate) && (
                        <button
                            onClick={handleResetFilter}
                            className="px-4 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors w-full md:w-auto"
                        >
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            {/* Top Stats Cards */}
            {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={80} className="text-emerald-600 transform translate-x-4 -translate-y-4" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Общая Выручка</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{totalRevenue?.toLocaleString() || 0} с.</h3>
                            </div>
                            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-1.5 text-xs font-medium border-t border-slate-100 pt-3 relative z-10">
                            <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg">
                                <span className="text-slate-500">POS (Магазин):</span>
                                <span className="text-slate-900 font-bold">{posRevenue?.toLocaleString() || 0} с.</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg">
                                <span className="text-slate-500">Mobile (Приложение):</span>
                                <span className="text-slate-900 font-bold">{mobileRevenue?.toLocaleString() || 0} с.</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Profit Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Banknote size={80} className="text-indigo-600 transform translate-x-4 -translate-y-4" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Чистая Прибыль</p>
                                <h3 className="text-3xl font-black text-indigo-600 mt-2">{netProfit?.toLocaleString() || 0} с.</h3>
                            </div>
                            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 text-xs font-medium border-t border-slate-100 pt-3 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Себестоимость (COGS):</span>
                                <span className="text-rose-500">-{totalCOGS?.toLocaleString() || 0} с.</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg">
                                <span className="text-slate-500">Закупка (Supply):</span>
                                <span className="text-rose-500">-{totalSupplies?.toLocaleString() || 0} с.</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Расходы:</span>
                                <span className="text-rose-500">-{totalExpenditures?.toLocaleString() || 0} с.</span>
                            </div>
                            <div className="flex justify-between items-center text-amber-600">
                                <span className="">Возвраты (минус от выручки):</span>
                                <span className="">-{totalRefunds?.toLocaleString() || 0} с.</span>
                            </div>
                        </div>
                    </div>

                    {/* Books Sold Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BookOpen size={80} className="text-blue-600 transform translate-x-4 -translate-y-4" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Книг продано</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{booksSold} шт.</h3>
                            </div>
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                                <BookOpen size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                            <span>В {totalOrders} заказах</span>
                        </div>
                    </div>

                    {/* Cashback Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag size={80} className="text-amber-500 transform translate-x-4 -translate-y-4" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Кешбек (Расход)</p>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">{totalCashbackUsed?.toLocaleString() || 0} с.</h3>
                            </div>
                            <div className="bg-amber-50 text-amber-500 p-3 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-1 items-start text-sm font-medium text-amber-600 relative z-10">
                            <span>Начислено (Потенциал): {totalCashbackIssued?.toLocaleString() || 0} с.</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Динамика продаж (За 30 дней)</h3>
                <div className="h-[350px] w-full">
                    {salesChart?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(tick) => {
                                        const d = new Date(tick);
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="POS_Продажи" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPos)" stackId="1" />
                                <Area type="monotone" dataKey="Mobile_Продажи" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorMobile)" stackId="1" />
                                <Area type="step" dataKey="Чистая_Прибыль" stroke="#6366f1" strokeWidth={3} fillOpacity={0} fill="url(#colorNet)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">Нет данных для графика</div>
                    )}
                </div>
            </div>

            {/* Daily/Monthly Breakdown Table */}
            <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Детальный отчет по дням / месяцам <span className="text-sm font-normal text-slate-500 ml-2">(Нажмите на строку для просмотра проданных книг)</span></h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-emerald-600 uppercase tracking-wider">POS (Магазин)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-sky-600 uppercase tracking-wider">Mobile (App)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Общие Продажи</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-rose-500 uppercase tracking-wider">Себестоимость</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-rose-500 uppercase tracking-wider">Закупка</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-rose-500 uppercase tracking-wider">Расходы</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-rose-500 uppercase tracking-wider">Возвраты</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase tracking-wider">Чистая Прибыль</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {salesChart?.length > 0 ? (
                                // Reverse the array to show recent dates first
                                [...salesChart].reverse().map((dayData: any, idx: number) => (
                                    <tr
                                        key={idx}
                                        onClick={() => handleRowClick(dayData.date)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 group-hover:text-indigo-600">
                                            {dayData.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 font-medium">
                                            {dayData.POS_Продажи?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-sky-600 font-medium">
                                            {dayData.Mobile_Продажи?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 font-bold bg-slate-50/50">
                                            {dayData.Общие_Продажи?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-500">
                                            -{dayData.Себестоимость?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-500">
                                            -{dayData.Закуп_Книг?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-500">
                                            -{dayData.Расходы?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-500">
                                            -{dayData.Возвраты?.toLocaleString() || 0} с.
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-600 font-bold bg-indigo-50/30">
                                            {dayData.Чистая_Прибыль?.toLocaleString() || 0} с.
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                                        Данные отсутствуют за выбранный период
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Books List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ArrowUpRight className="text-emerald-500" size={24} />
                        Топ 10 продаваемых книг
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {topBooks.length > 0 ? topBooks.map((book: any, index: number) => (
                            <div key={book._id} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-3 ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                    index === 1 ? 'bg-slate-200 text-slate-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-50 text-slate-400'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                                        {book.title}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 truncate">
                                        {book.author || 'Неизвестный автор'} • {book.price} с.
                                    </p>
                                </div>
                                <div className="ml-4 text-right">
                                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                        {book.soldCount || 0} шт
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 mt-10">Нет проданных книг</div>
                        )}
                    </div>
                </div>

                {/* Least Books List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <ArrowDownRight className="text-rose-500" size={24} />
                        Топ 10 слабо продаваемых
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {leastBooks && leastBooks.length > 0 ? leastBooks.map((book: any, index: number) => (
                            <div key={book._id} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                                <span className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-3 bg-slate-50 text-slate-400">
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-rose-600 transition-colors">
                                        {book.title}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 truncate">
                                        {book.author || 'Неизвестный автор'} • {book.price} с.
                                    </p>
                                </div>
                                <div className="ml-4 text-right">
                                    <div className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                                        {book.soldCount || 0} шт
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 mt-10">Нет слабо продаваемых книг</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Date Details Modal */}
            {selectedDateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Продажи за {selectedDateModal}</h3>
                                <p className="text-sm text-slate-500 mt-1">Список чеков (заказов) по клиентам</p>
                            </div>
                            <button
                                onClick={closeDateModal}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 text-indigo-500">
                                    <Loader2 className="animate-spin w-8 h-8 mb-4" />
                                    <p className="font-medium text-slate-500">Загрузка данных...</p>
                                </div>
                            ) : selectedDateSales && selectedDateSales.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDateSales.map((order: any) => {
                                        const isExpanded = expandedOrderId === order._id;
                                        const isPos = order.shippingAddress && order.shippingAddress.address === 'POS Sale';

                                        return (
                                            <div key={order._id} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-indigo-300 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                                                {/* Accordion Header (Summary) */}
                                                <div
                                                    onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                                                    className="flex flex-wrap sm:flex-nowrap items-center justify-between p-4 cursor-pointer hover:bg-slate-50 gap-4"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600 font-bold text-xs whitespace-nowrap">
                                                            {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-slate-900 text-sm truncate">
                                                                    {order.user?.name || 'Гость / Без клиента'}
                                                                </h4>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                                                    {isPos ? 'Магазин' : 'Приложение'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                Товаров: {order.items?.reduce((acc: number, item: any) => acc + item.qty, 0) || 0} шт.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                                                        <div className="text-right">
                                                            <div className="text-xs text-slate-500 font-medium mb-0.5">Сумма чека:</div>
                                                            <div className="text-base font-black text-indigo-600 bg-indigo-50/50 px-2 rounded-md">
                                                                {order.totalPrice?.toLocaleString()} с.
                                                            </div>
                                                        </div>
                                                        <div className={`p-1.5 rounded-full bg-slate-100 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-indigo-100 text-indigo-600' : ''}`}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Accordion Body (Items Details) */}
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                                            <table className="min-w-full divide-y divide-slate-100">
                                                                <thead className="bg-slate-50">
                                                                    <tr>
                                                                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Название Книги</th>
                                                                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Цена</th>
                                                                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Кол-во</th>
                                                                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">Сумма</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-slate-50">
                                                                    {order.items?.map((item: any, idx: number) => (
                                                                        <tr key={idx} className="hover:bg-slate-50">
                                                                            <td className="px-4 py-3">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-bold text-slate-800">{item.title || item.product?.title || 'Удаленный товар'}</span>
                                                                                    {item.product?.author && <span className="text-xs text-slate-500">{item.product.author}</span>}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-right text-slate-500 whitespace-nowrap">
                                                                                {item.price?.toLocaleString()} с.
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-right font-medium text-slate-700 whitespace-nowrap">
                                                                                {item.qty} шт.
                                                                            </td>
                                                                            <td className="px-4 py-3 text-sm text-right font-bold text-slate-900 whitespace-nowrap">
                                                                                {(item.price * item.qty).toLocaleString()} с.
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {order.totalPrice < order.items?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) && (
                                                                        <tr className="bg-rose-50/30">
                                                                            <td colSpan={3} className="px-4 py-2 text-xs font-bold text-rose-500 text-right">
                                                                                Скидка / Списание кэшбэка по чеку:
                                                                            </td>
                                                                            <td className="px-4 py-2 text-xs text-right font-bold text-rose-500 whitespace-nowrap">
                                                                                -{Math.round(order.items?.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0) - order.totalPrice).toLocaleString()} с.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-500">
                                    Нет данных о чеках за эту дату
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Reports;
