import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Plus, Search, Calendar, Trash2, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { getSupplies, reset, deleteSupply, getSupplyDetails, clearSupplyDetails } from '../features/supplies/supplySlice';
import type { AppDispatch, RootState } from '../app/store';
import SupplyModal from '../components/SupplyModal';
import BranchFilter from '../components/BranchFilter';


const Supplies = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { supplies, supplyDetails, isLoading, isError, message } = useSelector((state: RootState) => state.supplies);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        dispatch(getSupplies(selectedBranch));
        return () => {
            dispatch(reset());
        };
    }, [dispatch, isError, message, selectedBranch]);

    const filteredSupplies = supplies.filter((supply: any) => {
        const matchesSearch = supply.items.some((item: any) =>
            item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesDate = dateFilter ? supply.date.startsWith(dateFilter) : true;
        return matchesSearch && matchesDate;
    });

    const handleDelete = (id: string, cost: number) => {
        if (window.confirm(`Вы уверены, что хотите удалить этот приход на сумму ${cost.toLocaleString()} сом? Это действие также спишет книги со склада.`)) {
            dispatch(deleteSupply(id) as any);
        }
    };

    const handleViewDetails = (id: string) => {
        dispatch(getSupplyDetails(id));
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Package className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Поступления (Supplies)</h2>
                        <p className="text-slate-500 text-sm mt-1">Приход новых товаров и история поступлений</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus size={20} />
                    <span>Новый Приход</span>
                </button>
            </div>

            <SupplyModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); dispatch(getSupplies()); }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по названию книги..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full"
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full"
                    />
                </div>
                <BranchFilter />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Сотрудник</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Книги</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Итоговая сумма</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Загрузка...</td></tr>
                            ) : filteredSupplies.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Приходы не найдены</td></tr>
                            ) : (
                                filteredSupplies.map((supply: any) => (
                                    <tr key={supply._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {format(new Date(supply.date), 'dd.MM.yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {supply.createdBy?.name || 'Noma\'lum'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {supply.items.map((item: any, i: number) => (
                                                <div key={i} className="text-xs">
                                                    • {item.product?.title || 'Удаленная книга'} ({item.qty} шт.)
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                            {supply.totalCost.toLocaleString()} сом
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(supply._id)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Детали прихода"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supply._id, supply.totalCost)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Удалить приход"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
                    <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Eye size={24} className="text-indigo-600" />
                                    Детали прихода
                                </h3>
                                {supplyDetails && (
                                    <p className="text-sm text-slate-500 mt-1">
                                        {format(new Date(supplyDetails.date), 'dd MMMM yyyy, HH:mm')}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setIsDetailOpen(false); dispatch(clearSupplyDetails()); }}
                                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {!supplyDetails || isLoading ? (
                                <div className="py-20 text-center text-slate-500">Загрузка данных...</div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50/50 p-4 rounded-2xl flex justify-between items-center border border-indigo-50">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Сотрудник</p>
                                            <p className="text-sm font-semibold text-slate-900">{supplyDetails.createdBy?.name || 'Неизвестно'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Итоговая сумма</p>
                                            <p className="text-xl font-black text-indigo-700">{supplyDetails.totalCost.toLocaleString()} с.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Список книг</h4>
                                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Название</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Цена закупа</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Кол-во</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Сумма</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {supplyDetails.items.map((item: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                                                {item.product?.title || 'Книга удалена'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-500 text-right">
                                                                {item.purchasePrice?.toLocaleString() || 0} с.
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-700 font-bold text-right">
                                                                x{item.qty}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-indigo-600 font-bold text-right">
                                                                {(item.purchasePrice * item.qty).toLocaleString()} с.
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Supplies;
