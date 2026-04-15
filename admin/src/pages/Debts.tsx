import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import { getDebts, addDebt, payDebt, deleteDebt, resetDebts } from '../features/debts/debtSlice';
import { getBranches } from '../features/branches/branchSlice';
import { Plus, Trash2, CreditCard, History, X, Wallet, TrendingDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import BranchFilter from '../components/BranchFilter';

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatMoney = (n: number) =>
    new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' сум';

export default function Debts() {
    const dispatch = useDispatch<AppDispatch>();
    const { debts, isLoading } = useSelector((state: RootState) => state.debts);
    const { user } = useSelector((state: RootState) => state.auth);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const isSuperAdmin = user?.role === 'superadmin' || user?.isAdmin;
    const userBranchId = user?.branch?._id || user?.branch || '';

    const [showAddModal, setShowAddModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState<any>(null);
    const [showHistoryModal, setShowHistoryModal] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid'>('all');

    const [form, setForm] = useState({
        creditorName: '',
        creditorPhone: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        branch: isSuperAdmin ? '' : userBranchId,
    });

    const [payAmount, setPayAmount] = useState('');
    const [payNote, setPayNote] = useState('');

    useEffect(() => {
        dispatch(getDebts(isSuperAdmin ? selectedBranch || undefined : userBranchId as string));
        if (isSuperAdmin) dispatch(getBranches());
        return () => { dispatch(resetDebts()); };
    }, [selectedBranch]);

    const handleAdd = async () => {
        if (!form.creditorName || !form.amount) return;
        await dispatch(addDebt({
            ...form,
            amount: Number(form.amount),
            branch: isSuperAdmin ? (selectedBranch || '') : userBranchId,
        }));
        setShowAddModal(false);
        setForm({ creditorName: '', creditorPhone: '', amount: '', date: new Date().toISOString().split('T')[0], description: '', branch: '' });
    };

    const handlePay = async () => {
        if (!showPayModal || !payAmount) return;
        await dispatch(payDebt({ id: showPayModal._id, amount: Number(payAmount), note: payNote }));
        setShowPayModal(null);
        setPayAmount('');
        setPayNote('');
    };

    const handleDelete = async (id: string) => {
        await dispatch(deleteDebt(id));
        setDeleteConfirm(null);
    };

    const filtered = debts.filter((d: any) => filterStatus === 'all' ? true : d.status === filterStatus);

    const totalDebt = debts.reduce((s: number, d: any) => s + (d.debtAmount || 0), 0);
    const totalAmount = debts.reduce((s: number, d: any) => s + (d.amount || 0), 0);
    const totalPaid = debts.reduce((s: number, d: any) => s + (d.paidAmount || 0), 0);
    const activeCount = debts.filter((d: any) => d.status === 'active').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Долги (Займы)</h1>
                    <p className="text-sm text-slate-500 mt-1">Полученные займы и история погашения</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Добавить долг
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <TrendingDown size={20} className="text-rose-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Остаток долга</p>
                            <p className="text-lg font-bold text-rose-600">{formatMoney(totalDebt)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Wallet size={20} className="text-slate-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Всего получено</p>
                            <p className="text-lg font-bold text-slate-800">{formatMoney(totalAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Выплачено</p>
                            <p className="text-lg font-bold text-emerald-600">{formatMoney(totalPaid)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Активных долгов</p>
                            <p className="text-lg font-bold text-amber-600">{activeCount} шт.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {(['all', 'active', 'paid'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${filterStatus === s ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {s === 'all' ? 'Все' : s === 'active' ? 'Активные' : 'Погашенные'}
                        </button>
                    ))}
                </div>
                <BranchFilter label="" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-rose-500 rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <AlertCircle size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">Долгов нет</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Кредитор</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Дата</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Сумма</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Выплачено</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Остаток</th>
                                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Статус</th>
                                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((debt: any) => (
                                    <tr key={debt._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800">{debt.creditorName}</p>
                                            {debt.creditorPhone && (
                                                <p className="text-xs text-slate-400">{debt.creditorPhone}</p>
                                            )}
                                            {debt.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 italic">{debt.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(debt.date)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-700">{formatMoney(debt.amount)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatMoney(debt.paidAmount)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600">{formatMoney(debt.debtAmount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {debt.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                    <CheckCircle size={12} /> Погашен
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                                    <Clock size={12} /> Активный
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setShowHistoryModal(debt)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                    title="История платежей"
                                                >
                                                    <History size={16} />
                                                </button>
                                                {debt.status === 'active' && (
                                                    <button
                                                        onClick={() => { setShowPayModal(debt); setPayAmount(''); setPayNote(''); }}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors"
                                                        title="Внести платёж"
                                                    >
                                                        <CreditCard size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirm(debt._id)}
                                                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Debt Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Добавить новый долг</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Имя кредитора *</label>
                                <input
                                    type="text"
                                    value={form.creditorName}
                                    onChange={(e) => setForm({ ...form, creditorName: e.target.value })}
                                    placeholder="Например: Акмал ака"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Номер телефона</label>
                                <input
                                    type="text"
                                    value={form.creditorPhone}
                                    onChange={(e) => setForm({ ...form, creditorPhone: e.target.value })}
                                    placeholder="+998 90 123 45 67"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Сумма долга (сум) *</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Примечание</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Причина займа или комментарий..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 pt-0">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Отмена
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!form.creditorName || !form.amount || isLoading}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Внести платёж</h2>
                            <button onClick={() => setShowPayModal(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-rose-50 rounded-xl p-4">
                                <p className="text-sm text-slate-600">Кредитор: <span className="font-semibold text-slate-800">{showPayModal.creditorName}</span></p>
                                <p className="text-sm text-slate-600 mt-1">Остаток долга: <span className="font-bold text-rose-600">{formatMoney(showPayModal.debtAmount)}</span></p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Сумма платежа (сум) *</label>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    max={showPayModal.debtAmount}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Примечание (необязательно)</label>
                                <input
                                    type="text"
                                    value={payNote}
                                    onChange={(e) => setPayNote(e.target.value)}
                                    placeholder="Комментарий к платежу..."
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 pt-0">
                            <button onClick={() => setShowPayModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Отмена
                            </button>
                            <button
                                onClick={handlePay}
                                disabled={!payAmount || isLoading}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                Оплатить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">История платежей</h2>
                                <p className="text-sm text-slate-500">{showHistoryModal.creditorName}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between text-sm mb-4 bg-slate-50 rounded-xl p-3">
                                <span className="text-slate-600">Итого: <span className="font-bold text-slate-800">{formatMoney(showHistoryModal.amount)}</span></span>
                                <span className="text-slate-600">Выплачено: <span className="font-bold text-emerald-600">{formatMoney(showHistoryModal.paidAmount)}</span></span>
                                <span className="text-slate-600">Остаток: <span className="font-bold text-rose-600">{formatMoney(showHistoryModal.debtAmount)}</span></span>
                            </div>
                            {showHistoryModal.paymentHistory?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <History size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Платежей нет</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {showHistoryModal.paymentHistory?.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-emerald-700">{formatMoney(p.amount)}</p>
                                                {p.note && <p className="text-xs text-slate-500 mt-0.5">{p.note}</p>}
                                                {p.handledBy?.name && <p className="text-xs text-slate-400">{p.handledBy.name}</p>}
                                            </div>
                                            <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} className="text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Подтвердите удаление</h3>
                        <p className="text-sm text-slate-500 mb-6">Запись о долге будет удалена. Это действие нельзя отменить.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                                Отмена
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
