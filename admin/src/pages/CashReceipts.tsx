import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/store';
import { getCashReceipts, addCashReceipt, deleteCashReceipt, resetCashReceipts } from '../features/cashReceipts/cashReceiptSlice';
import { getBranches } from '../features/branches/branchSlice';
import { Plus, Trash2, X, Wallet, TrendingUp, Users, AlertCircle, ArrowDownToLine } from 'lucide-react';
import BranchFilter from '../components/BranchFilter';

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatMoney = (n: number) =>
    new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' сум';

export default function CashReceipts() {
    const dispatch = useDispatch<AppDispatch>();
    const { receipts, isLoading } = useSelector((state: RootState) => state.cashReceipts);
    const { user } = useSelector((state: RootState) => state.auth);
    const { branches, selectedBranch } = useSelector((state: RootState) => state.branches);

    const isSuperAdmin = user?.role === 'superadmin' || user?.isAdmin;
    const userBranchId = user?.branch?._id || user?.branch || '';

    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        donorName: '',
        donorPhone: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        branch: isSuperAdmin ? '' : userBranchId,
    });

    useEffect(() => {
        dispatch(getCashReceipts(isSuperAdmin ? selectedBranch || undefined : userBranchId as string));
        if (isSuperAdmin) dispatch(getBranches());
        return () => { dispatch(resetCashReceipts()); };
    }, [selectedBranch]);

    const handleAdd = async () => {
        if (!form.donorName || !form.amount) return;
        await dispatch(addCashReceipt({
            ...form,
            amount: Number(form.amount),
            branch: isSuperAdmin ? (selectedBranch || '') : userBranchId,
        }));
        setShowAddModal(false);
        setForm({
            donorName: '', donorPhone: '', amount: '',
            description: '', date: new Date().toISOString().split('T')[0],
            branch: isSuperAdmin ? '' : userBranchId as string,
        });
    };

    const handleDelete = async (id: string) => {
        await dispatch(deleteCashReceipt(id));
        setDeleteConfirm(null);
    };

    const filtered = receipts.filter((r: any) =>
        searchTerm === '' ||
        r.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = receipts.reduce((s: number, r: any) => s + (r.amount || 0), 0);
    const uniqueDonors = new Set(receipts.map((r: any) => r.donorName)).size;
    const thisMonthAmount = receipts
        .filter((r: any) => {
            const d = new Date(r.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s: number, r: any) => s + (r.amount || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Поступления</h1>
                    <p className="text-sm text-slate-500 mt-1">Полученные средства от руководства и знакомых</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Добавить поступление
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Wallet size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Всего поступило</p>
                            <p className="text-lg font-bold text-indigo-600">{formatMoney(totalAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">В этом месяце</p>
                            <p className="text-lg font-bold text-emerald-600">{formatMoney(thisMonthAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Уникальных источников</p>
                            <p className="text-lg font-bold text-amber-600">{uniqueDonors} чел.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Поиск по имени или примечанию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-64"
                />
                <BranchFilter label="" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <AlertCircle size={40} className="mb-3 opacity-30" />
                        <p className="font-medium">Поступлений нет</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Отправитель</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Дата</th>
                                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Сумма</th>
                                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((r: any) => (
                                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <ArrowDownToLine size={14} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{r.donorName}</p>
                                                    {r.donorPhone && (
                                                        <p className="text-xs text-slate-400">{r.donorPhone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            <p>{formatDate(r.date)}</p>
                                            {r.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 italic">{r.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="font-bold text-indigo-600">{formatMoney(r.amount)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setDeleteConfirm(r._id)}
                                                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td colSpan={2} className="px-4 py-3 font-semibold text-slate-600">Итого ({filtered.length} записей)</td>
                                    <td className="px-4 py-3 text-right font-bold text-indigo-600">
                                        {formatMoney(filtered.reduce((s: number, r: any) => s + (r.amount || 0), 0))}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Добавить поступление</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Имя отправителя *</label>
                                <input
                                    type="text"
                                    value={form.donorName}
                                    onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                                    placeholder="Например: Директор, Акмал ака"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Номер телефона</label>
                                <input
                                    type="text"
                                    value={form.donorPhone}
                                    onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
                                    placeholder="+998 90 123 45 67"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Сумма (сум) *</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Дата</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Примечание</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Дополнительная информация..."
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 pt-0">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Отмена
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!form.donorName || !form.amount || isLoading}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                Сохранить
                            </button>
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
                        <p className="text-sm text-slate-500 mb-6">Запись о поступлении будет удалена. Это действие нельзя отменить.</p>
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
