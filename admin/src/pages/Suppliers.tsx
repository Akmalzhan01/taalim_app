import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSuppliers, createSupplier, paySupplier, deleteSupplier, reset } from '../features/suppliers/supplierSlice';
import type { AppDispatch, RootState } from '../app/store';
import { CreditCard, Plus, Search, Truck, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Suppliers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { suppliers, isLoading, isError, message } = useSelector((state: RootState) => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);

    // Add Form State
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newSupplierPhone, setNewSupplierPhone] = useState('');
    const [newSupplierDebt, setNewSupplierDebt] = useState('');

    // Pay Form State
    const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentComment, setPaymentComment] = useState('');

    useEffect(() => {
        dispatch(getSuppliers());
        return () => { dispatch(reset()); };
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
    }, [isError, message]);

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createSupplier({
            name: newSupplierName,
            phone: newSupplierPhone,
            initialDebt: newSupplierDebt ? parseFloat(newSupplierDebt) : 0
        }));
        setNewSupplierName('');
        setNewSupplierPhone('');
        setNewSupplierDebt('');
        setIsAddModalOpen(false);
        toast.success("Поставщик добавлен");
    };

    const handlePaySupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplierForPay || !paymentAmount) return;

        dispatch(paySupplier({
            id: selectedSupplierForPay._id,
            paymentData: {
                amount: parseFloat(paymentAmount),
                comment: paymentComment
            }
        }));
        setPaymentAmount('');
        setPaymentComment('');
        setSelectedSupplierForPay(null);
        setIsPayModalOpen(false);
        toast.success("Оплата принята");
    };

    const handleDeleteSupplier = (id: string, name: string) => {
        if (window.confirm(`Вы уверены, что хотите удалить поставщика "${name}"? Это действие необратимо.`)) {
            dispatch(deleteSupplier(id));
            toast.success("Поставщик удален");
        }
    };

    const filteredSuppliers = suppliers.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm))
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Truck className="text-indigo-600" size={32} />
                        Поставщики (Долги)
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">
                        Расчеты с издательствами и поставщиками товаров
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
                >
                    <Plus size={20} /> Добавить поставщика
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 font-semibold mb-1 text-sm">Всего поставщиков</div>
                    <div className="text-2xl font-black text-slate-800">{suppliers.length}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 font-semibold mb-1 text-sm">Наш общий долг</div>
                    <div className="text-2xl font-black text-rose-600">
                        {suppliers.reduce((acc: number, s: any) => acc + (s.totalSuppliedAmount - s.totalPaidAmount), 0).toLocaleString()} <span className="text-base font-bold text-slate-400">сом</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-slate-500 font-semibold mb-1 text-sm">Всего оплачено</div>
                    <div className="text-2xl font-black text-emerald-600">
                        {suppliers.reduce((acc: number, s: any) => acc + s.totalPaidAmount, 0).toLocaleString()} <span className="text-base font-bold text-slate-400">сом</span>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Поиск (имя, тел)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">#</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Поставщик</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Поставленный товар</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Оплачено</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Текущий долг</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {(isLoading ? Array(5).fill({}) : filteredSuppliers).map((supplier: any, idx: number) => {
                                if (isLoading) {
                                    return (
                                        <tr key={idx} className="animate-pulse">
                                            <td className="p-4"><div className="h-4 bg-slate-200 rounded w-4 mx-auto"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                                            <td className="p-4"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                                            <td className="p-4"><div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div></td>
                                        </tr>
                                    );
                                }
                                const currentDebt = supplier.totalSuppliedAmount - supplier.totalPaidAmount;

                                return (
                                    <tr key={supplier._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">{supplier.name}</div>
                                            {supplier.phone && <div className="text-xs font-medium text-slate-500 mt-0.5">{supplier.phone}</div>}
                                        </td>
                                        <td className="p-4 text-right font-medium text-slate-600">
                                            {supplier.totalSuppliedAmount.toLocaleString()} <span className="text-xs text-slate-400">сом</span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-emerald-600">
                                            {supplier.totalPaidAmount.toLocaleString()} <span className="text-xs text-emerald-400/50">сом</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex font-bold px-2.5 py-1 rounded-lg ${currentDebt > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {currentDebt.toLocaleString()} сом
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSupplierForPay(supplier);
                                                        setIsPayModalOpen(true);
                                                    }}
                                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                                >
                                                    Оплатить
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(supplier._id, supplier.name)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Удалить поставщика"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!isLoading && filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Поставщик не найден.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Новый поставщик</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSupplier} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Имя/Компания *</label>
                                <input
                                    type="text"
                                    required
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                                    placeholder="Например: Hilol Nashr"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Телефон (необязательно)</label>
                                <input
                                    type="text"
                                    value={newSupplierPhone}
                                    onChange={(e) => setNewSupplierPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                                    placeholder="+996 550 123 456"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Начальный долг (необязательно)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newSupplierDebt}
                                    onChange={(e) => setNewSupplierDebt(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                                    placeholder="0"
                                />
                                <p className="text-xs text-slate-400 mt-1">Текущая задолженность перед поставщиком</p>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Modal */}
            {isPayModalOpen && selectedSupplierForPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPayModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <CreditCard size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Оплата долга</h3>
                            </div>
                            <button onClick={() => setIsPayModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                            <div className="text-sm font-medium text-slate-500">Поставщик: <span className="font-bold text-slate-800">{selectedSupplierForPay.name}</span></div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Текущий долг: <span className="font-bold text-rose-600">{(selectedSupplierForPay.totalSuppliedAmount - selectedSupplierForPay.totalPaidAmount).toLocaleString()} сом</span></div>
                        </div>
                        <form onSubmit={handlePaySupplier} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Сумма оплаты *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-lg font-black text-slate-800"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Комментарий (необязательно)</label>
                                <input
                                    type="text"
                                    value={paymentComment}
                                    onChange={(e) => setPaymentComment(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                                    placeholder="Например: За партию книг от 10-го числа"
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
                                    Подтвердить оплату
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Suppliers;
