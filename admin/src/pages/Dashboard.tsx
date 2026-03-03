import { useEffect } from 'react';
import { Package, TrendingUp, AlertCircle, Calendar, Users, Loader, ChevronRight, Clock, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats } from '../features/orders/orderSlice';
import { getBranches } from '../features/branches/branchSlice';
import type { AppDispatch, RootState } from '../app/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import BranchFilter from '../components/BranchFilter';

const Dashboard = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { stats, isLoading } = useSelector((state: RootState) => state.orderList);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    useEffect(() => {
        dispatch(getBranches());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getDashboardStats(selectedBranch));
    }, [dispatch, selectedBranch]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    const {
        totalIncome = 0,
        totalSupplies = 0,
        totalExp = 0,
        netProfit = 0,
        totalOrders = 0,
        totalUsers = 0,
        monthlySales = [],
        latestPendingOrders = []
    } = (stats as any) || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                        <Store className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Обзор (Dashboard)</h2>
                        <p className="text-slate-500 text-sm mt-1">Добро пожаловать, {user?.name}</p>
                    </div>
                </div>

                <BranchFilter />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <TrendingUp className="text-emerald-600 h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Чистая прибыль</h3>
                        <p className="text-2xl font-black text-slate-900 mt-1">{netProfit.toLocaleString()} сом</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <Package className="text-blue-600 h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Всего заказов</h3>
                        <p className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-transform border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-50 rounded-2xl">
                            <Users className="text-violet-600 h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Клиенты</h3>
                        <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Calendar className="text-indigo-600 h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Оборот (Revenue)</h3>
                        <p className="text-2xl font-black text-slate-900 mt-1">{totalIncome.toLocaleString()} сом</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <AlertCircle className="text-rose-600 h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Расходы (Приход + Доп)</h3>
                        <p className="text-2xl font-black text-slate-900 mt-1">{(totalSupplies + totalExp).toLocaleString()} сом</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Calendar className="text-indigo-600 h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Аналитика продаж</h3>
                    </div>

                    <div className="h-80 w-full">
                        {monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlySales}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)', border: 'none' }}
                                    />
                                    <Bar dataKey="sales" name="Продажи (сом)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <p>Нет данных о продажах за последний год</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Orders List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Clock className="text-orange-600 h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Ожидают</h3>
                        </div>
                        <Link to="/dashboard/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                            Все <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {latestPendingOrders && latestPendingOrders.length > 0 ? (
                            latestPendingOrders.map((order: any) => (
                                <Link to={`/dashboard/orders/${order._id}`} key={order._id} className="block group">
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {order.user?.name ? order.user.name.substring(0, 2) : '??'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                                    #{order._id.substring(0, 8)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {order.user?.name || 'Гость'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-sm">{order.totalPrice} с</p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                Нет ожидающих заказов
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
