import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, CheckCircle, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getOrders, deliverOrder } from '../features/orders/orderSlice';
import { getBranches } from '../features/branches/branchSlice';
import type { AppDispatch, RootState } from '../app/store';
import BranchFilter from '../components/BranchFilter';

const Orders = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { orders = [] } = useSelector((state: RootState) => state.orderList);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, delivered, processing
    const [sourceFilter, setSourceFilter] = useState('all'); // all, online, pos
    const [monthFilter, setMonthFilter] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }); // Default to current month
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        dispatch(getBranches());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getOrders(selectedBranch));
    }, [dispatch, selectedBranch]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sourceFilter, monthFilter, selectedBranch]);

    const handleDeliver = (id: string) => {
        if (window.confirm('Пометить как доставленный?')) {
            dispatch(deliverOrder(id));
        }
    };

    const getStatusColor = (order: any) => {
        if (order.isRefunded) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (order.isDelivered) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const getStatusText = (order: any) => {
        if (order.isRefunded) return 'Возврат';
        if (order.isDelivered) return 'Доставлен';
        return 'В обработке';
    };

    const filteredOrders = orders.filter((order: any) => {
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user && order.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesStatus = true;
        if (statusFilter === 'delivered') matchesStatus = order.isDelivered && !order.isRefunded;
        if (statusFilter === 'processing') matchesStatus = !order.isDelivered && !order.isRefunded;
        if (statusFilter === 'refunded') matchesStatus = order.isRefunded;

        let matchesMonth = true;
        if (monthFilter) {
            const orderDate = new Date(order.createdAt);
            const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            matchesMonth = orderMonth === monthFilter;
        }

        let matchesSource = true;
        const isPos = order.comment?.includes('POS Sale') || order.shippingAddress?.address === 'POS Sale';
        if (sourceFilter === 'online') matchesSource = !isPos;
        if (sourceFilter === 'pos') matchesSource = isPos;

        return matchesSearch && matchesStatus && matchesMonth && matchesSource;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Заказы</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление заказами и отслеживание статусов</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск по ID или имени..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                            <option value="all">Все статусы</option>
                            <option value="processing">В обработке</option>
                            <option value="delivered">Доставлен</option>
                            <option value="refunded">Возврат</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                            <option value="all">Все заказы</option>
                            <option value="online">Онлайн</option>
                            <option value="pos">Касса (POS)</option>
                        </select>
                    </div>
                    <div className="relative">
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        />
                    </div>
                    <BranchFilter />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID заказа</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Клиент</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Сумма</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Оплата</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentOrders.map((order: any) => (
                                <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                                <Package size={18} />
                                            </div>
                                            <span className="font-medium text-slate-900 text-xs">{order._id.substring(0, 10)}...</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-600 font-medium">{order.user ? order.user.name : 'Гость'}</span>
                                            {order.comment?.includes('POS Sale') || order.shippingAddress?.address === 'POS Sale' ? (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                                    КАССА (POS)
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-fit mt-1">
                                                    ОНЛАЙН
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                        {Number(order.totalPrice).toLocaleString()} сом
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {order.isPaid ? 'Оплачено' : 'Не оплачено'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order)}`}>
                                            {getStatusText(order)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/dashboard/orders/${order._id}`}
                                                className="text-indigo-500 hover:text-indigo-700 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Подробнее"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            {!order.isDelivered && !order.isRefunded && (
                                                <button
                                                    onClick={() => handleDeliver(order._id)}
                                                    className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Отметить как доставленный"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        Заказы не найдены
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="text-sm text-slate-500">
                            Страница <span className="font-bold text-slate-900">{currentPage}</span> из <span className="font-bold text-slate-900">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => paginate(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-600"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
