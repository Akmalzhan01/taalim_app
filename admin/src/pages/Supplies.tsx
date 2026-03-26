import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Plus, Search, Calendar, Trash2, Eye, X, Check, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { getSupplies, reset, deleteSupply, getSupplyDetails, clearSupplyDetails, payDebt } from '../features/supplies/supplySlice';
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
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedSupplyForPay, setSelectedSupplyForPay] = useState<any>(null);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => {
        dispatch(getSupplies(selectedBranch));
        return () => {
            dispatch(reset());
        };
    }, [dispatch, isError, message, selectedBranch]);

    const filteredSupplies = supplies.filter((supply: any) => {
        const matchesSearch =
            supply.items.some((item: any) => item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            supply.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = dateFilter ? supply.date.startsWith(dateFilter) : true;
        return matchesSearch && matchesDate;
    });

    const handleDelete = (id: string, cost: number) => {
        if (window.confirm(`Вы уверены, что хотите удалить этот приход на сомму ${cost.toLocaleString()} сом? Это действие также спишет книги со склада.`)) {
            dispatch(deleteSupply(id) as any);
        }
    };

    const handleViewDetails = (id: string) => {
        dispatch(getSupplyDetails(id));
        setIsDetailOpen(true);
    };

    const handleOpenPayModal = (supply: any) => {
        setSelectedSupplyForPay(supply);
        setPayAmount(supply.debtAmount.toString());
        setIsPayModalOpen(true);
    };

    const handlePayDebt = async () => {
        if (!selectedSupplyForPay || !payAmount) return;
        const resultAction = await dispatch(payDebt({ id: selectedSupplyForPay._id, amount: Number(payAmount) }));
        if (payDebt.fulfilled.match(resultAction)) {
            alert('Оплата успешно зафиксирована');
            setIsPayModalOpen(false);
            setSelectedSupplyForPay(null);
            setPayAmount('');
        } else {
            alert('Ошибка при оплате');
        }
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Поставщик</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Книги</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус / Долг</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Сумма</th>
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
                                            {format(new Date(supply.date), 'dd.MM.yy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900">{supply.supplierName || '---'}</div>
                                            <div className="text-xs text-slate-500">{supply.supplierPhone || ''}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                                {supply.items.length} наим.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {supply.type === 'adjustment' ? (
                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit bg-amber-100 text-amber-700">
                                                        Korrektura
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${supply.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {supply.paymentStatus === 'paid' ? 'Оплачено' : 'Долг'}
                                                        </span>
                                                        {supply.debtAmount > 0 && (
                                                            <span className="text-sm font-black text-rose-600">
                                                                {supply.debtAmount.toLocaleString()} сом
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                            {supply.totalAmount?.toLocaleString() || (supply.totalCost || 0).toLocaleString()} сом
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                                            {supply.type !== 'adjustment' && supply.paymentStatus === 'debt' && (
                                                <button
                                                    onClick={() => handleOpenPayModal(supply)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Оплатить долг"
                                                >
                                                    <CreditCard size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleViewDetails(supply._id)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Детали"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supply._id, supply.totalAmount || supply.totalCost)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Удалить"
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-50">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Поставщик</p>
                                            <p className="text-sm font-bold text-slate-900">{supplyDetails.supplierName || '---'}</p>
                                            <p className="text-xs text-slate-500">{supplyDetails.supplierPhone || ''}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Статус / Оплачено</p>
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${supplyDetails.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {supplyDetails.paymentStatus === 'paid' ? 'Полностью оплачено' : 'Есть задолженность'}
                                                </span>
                                                <p className="text-sm font-semibold text-emerald-600">Оплачено: {supplyDetails.paidAmount?.toLocaleString()} сом</p>
                                                {supplyDetails.debtAmount > 0 && <p className="text-sm font-bold text-rose-600">Долг: {supplyDetails.debtAmount?.toLocaleString()} сом</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Итоговая сомма</p>
                                            <p className="text-2xl font-black text-indigo-700">{(supplyDetails.totalAmount || supplyDetails.totalCost).toLocaleString()} сом</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Создал: {supplyDetails.createdBy?.name}</p>
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
                                                                {item.purchasePrice?.toLocaleString() || 0} сом
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-700 font-bold text-right">
                                                                x{item.qty}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-indigo-600 font-bold text-right">
                                                                {(item.purchasePrice * item.qty).toLocaleString()} сом
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {supplyDetails.paymentHistory && supplyDetails.paymentHistory.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider mt-4">История оплат</h4>
                                            <div className="border border-emerald-100 rounded-xl overflow-hidden">
                                                <table className="min-w-full">
                                                    <thead className="bg-emerald-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-600">Дата оплаты</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-600">Сумма оплаты</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-emerald-50">
                                                        {supplyDetails.paymentHistory.map((payment: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-emerald-50/50">
                                                                <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                                                    {format(new Date(payment.date), 'dd.MM.yyyy HH:mm')}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-emerald-600 font-bold text-right">
                                                                    {payment.amount.toLocaleString()} сом
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Debt Modal */}
            {isPayModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Оплата долга</h3>
                            <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-1">Текущий долг</p>
                                <p className="text-2xl font-black text-orange-700">{selectedSupplyForPay?.debtAmount.toLocaleString()} сом</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Сумма оплаты</label>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-900"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handlePayDebt}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={20} /> Зафиксировать оплату
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Supplies;
