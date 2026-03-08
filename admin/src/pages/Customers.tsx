import { useEffect, useState } from 'react';
import { Trash2, Edit, UserPlus, X, Phone, User as UserIcon, Store, Check, Loader2, TrendingUp, Search, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomers, deleteCustomer, createCustomer, updateCustomer, reset } from '../features/customers/customerSlice';
import { getBranches } from '../features/branches/branchSlice';
import type { AppDispatch, RootState } from '../app/store';
import BranchFilter from '../components/BranchFilter';

const Customers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { customers, isLoading, isSuccess } = useSelector((state: RootState) => state.customers);
    const { branches, selectedBranch } = useSelector((state: RootState) => state.branches);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        branch: ''
    });

    useEffect(() => {
        dispatch(getCustomers());
        dispatch(getBranches());
    }, [dispatch]);

    useEffect(() => {
        if (isSuccess && isModalOpen) {
            setIsModalOpen(false);
            setIsEditMode(false);
            setSelectedId(null);
            setFormData({
                name: '',
                phone: '',
                branch: ''
            });
            dispatch(reset());
        }
    }, [isSuccess, isModalOpen, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Mijozni o\'chirishni xohlaysizmi?')) {
            dispatch(deleteCustomer(id));
        }
    };

    const handleEdit = (customer: any) => {
        setIsEditMode(true);
        setSelectedId(customer._id);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            branch: customer.branch?._id || customer.branch || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode && selectedId) {
            dispatch(updateCustomer({ id: selectedId, customerData: formData }));
        } else {
            dispatch(createCustomer(formData));
        }
    };

    const filteredCustomers = customers
        .filter((c: any) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        )
        .filter((c: any) => {
            if (!selectedBranch) return true;
            const customerBranchId = typeof c.branch === 'object' ? c.branch?._id : c.branch;
            return customerBranchId === selectedBranch;
        });

    // Ranking: Sort by amount
    const sortedCustomers = [...filteredCustomers].sort((a: any, b: any) => b.totalPurchasedAmount - a.totalPurchasedAmount);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mijozlar Bazasi (CRM)</h2>
                    <p className="text-slate-500 text-sm mt-1">Sodiq mijozlar va ularning xarid tarixi</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Qidirish (Ism yoki Tel)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                        />
                    </div>
                    <BranchFilter />
                    <button
                        onClick={() => { setIsEditMode(false); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-200 border-b-4 border-slate-700 active:border-b-0 active:translate-y-1"
                    >
                        <UserPlus size={18} /> Yangi Mijoz
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <UserPlus size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Jami Mijozlar</p>
                        <h4 className="text-2xl font-black text-slate-900">{customers.length}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Umumiy Savdo (CRM)</p>
                        <h4 className="text-2xl font-black text-slate-900">
                            {customers.reduce((acc, c: any) => acc + c.totalPurchasedAmount, 0).toLocaleString()} <span className="text-sm">som</span>
                        </h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Award size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Top Mijoz</p>
                        <h4 className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                            {sortedCustomers[0]?.name || '-'}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Mijoz</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Telefon</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Jami Xarid</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Soni</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Filial</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedCustomers.map((customer: any, index: number) => (
                            <tr key={customer._id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 relative">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold border ${index === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                    index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                        index === 2 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                {index < 3 ? <Award size={18} /> : customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            {index < 3 && (
                                                <div className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow-sm border border-slate-100">
                                                    {index + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-slate-900">{customer.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Qo'shildi: {new Date(customer.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-slate-400" />
                                        {customer.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-indigo-600">
                                    {customer.totalPurchasedAmount.toLocaleString()} <span className="text-[10px] text-slate-400">som</span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                                        {customer.totalOrders} ta buyurtma
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        {customer.branch?.name || 'Markaziy'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(customer)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all" title="Tahrirlash">
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="O'chirish"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedCustomers.length === 0 && !isLoading && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Mijozlar topilmadi</h3>
                        <p className="text-slate-500 text-sm mt-1">Qidiruv natijasida yoki tanlangan filialda mijozlar yo'q</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditMode ? 'Mijozni Tahrirlash' : 'Yangi Mijoz'}</h3>
                                <p className="text-sm text-slate-500 mt-1">Ma'lumotlarni to'g'ri kiriting</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Mijoz Ismi</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                        placeholder="Masalan: Alisher Navoiy"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Telefon Raqami</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                        placeholder="998901234567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Filial</label>
                                <div className="relative group">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <select
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                    >
                                        <option value="">Markaziy</option>
                                        {branches.map((b: any) => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-[20px] font-black text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600 transition-all text-sm mb-6"
                                >
                                    Bekor Qilish
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-[20px] hover:bg-indigo-600 transition-all text-sm mb-6 shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 border-b-4 border-slate-700 hover:border-indigo-800 active:border-b-0 active:translate-y-1"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    {isEditMode ? 'Saqlash' : 'Qo\'shish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
