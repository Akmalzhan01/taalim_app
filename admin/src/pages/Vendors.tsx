import { useEffect, useState } from 'react';
import { Trash2, Edit, Truck, X, Phone, User as UserIcon, Store, Check, Loader2, TrendingUp, Search, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getVendors, deleteVendor, createVendor, updateVendor, reset } from '../features/vendors/vendorSlice';
import { getBranches } from '../features/branches/branchSlice';
import type { AppDispatch, RootState } from '../app/store';
import BranchFilter from '../components/BranchFilter';

const Vendors = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { vendors, isLoading, isSuccess } = useSelector((state: RootState) => state.vendors);
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
        dispatch(getVendors());
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
        if (window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
            dispatch(deleteVendor(id));
        }
    };

    const handleEdit = (vendor: any) => {
        setIsEditMode(true);
        setSelectedId(vendor._id);
        setFormData({
            name: vendor.name,
            phone: vendor.phone,
            branch: vendor.branch?._id || vendor.branch || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode && selectedId) {
            dispatch(updateVendor({ id: selectedId, vendorData: formData }));
        } else {
            dispatch(createVendor(formData));
        }
    };

    const filteredVendors = vendors
        .filter((c: any) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        )
        .filter((c: any) => {
            if (!selectedBranch) return true;
            const vendorBranchId = typeof c.branch === 'object' ? c.branch?._id : c.branch;
            return vendorBranchId === selectedBranch;
        });

    // Ranking: Sort by amount
    const sortedVendors = [...filteredVendors].sort((a: any, b: any) => b.totalSuppliedAmount - a.totalSuppliedAmount);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Поставщики</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление поставщиками и история поставок</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск (Имя или телефон)..."
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
                        <Truck size={18} /> Новый поставщик
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Truck size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Всего поставщиков</p>
                        <h4 className="text-2xl font-black text-slate-900">{vendors.length}</h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Сумма всех поставок</p>
                        <h4 className="text-2xl font-black text-slate-900">
                            {vendors.reduce((acc, c: any) => acc + c.totalSuppliedAmount, 0).toLocaleString()} <span className="text-sm">сом</span>
                        </h4>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Award size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Лучший поставщик</p>
                        <h4 className="text-lg font-bold text-slate-900 truncate max-w-[150px]">
                            {sortedVendors[0]?.name || '-'}
                        </h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Поставщик</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Телефон</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Всего поставок</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Количество</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Филиал</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedVendors.map((vendor: any, index: number) => (
                            <tr key={vendor._id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 relative">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold border ${index === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                index === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    index === 2 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                {index < 3 ? <Award size={18} /> : vendor.name.charAt(0).toUpperCase()}
                                            </div>
                                            {index < 3 && (
                                                <div className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow-sm border border-slate-100">
                                                    {index + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-slate-900">{vendor.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium">Добавлен: {new Date(vendor.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 font-bold flex items-center gap-2">
                                        <Phone size={14} className="text-slate-400" />
                                        {vendor.phone || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-indigo-600">
                                    {vendor.totalSuppliedAmount.toLocaleString()} <span className="text-[10px] text-slate-400">сом</span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                                        {vendor.totalSupplies} поставок
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        {vendor.branch?.name || 'Центральный'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(vendor)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all" title="Редактировать">
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(vendor._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Удалить"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedVendors.length === 0 && !isLoading && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Поставщики не найдены</h3>
                        <p className="text-slate-500 text-sm mt-1">В результате поиска или в выбранном филиале нет поставщиков</p>
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
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditMode ? 'Редактировать поставщика' : 'Новый поставщик'}</h3>
                                <p className="text-sm text-slate-500 mt-1">Введите данные правильно</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Имя поставщика</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                        placeholder="Например: Alisher Books"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Номер телефона</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                        placeholder="+998901234567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Филиал</label>
                                <div className="relative group">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                    <select
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[20px] text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                    >
                                        <option value="">Центральный</option>
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
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-[20px] hover:bg-indigo-600 transition-all text-sm mb-6 shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 border-b-4 border-slate-700 hover:border-indigo-800 active:border-b-0 active:translate-y-1"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                                    {isEditMode ? 'Сохранить' : 'Добавить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
