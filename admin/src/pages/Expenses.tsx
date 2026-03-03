import { useState, useEffect } from 'react';
import axios from 'axios';
import ExpenseModal from '../components/ExpenseModal';
import { Plus, Search, Trash2, Edit2, ReceiptText, Calendar } from 'lucide-react';
import BranchFilter from '../components/BranchFilter';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

interface Expense {
    _id: string;
    title: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    user: {
        _id: string;
        name: string;
    };
}

const Expenses = () => {
    // Get user from localStorage for initial branch state
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const API_URL = 'http://localhost:5000/api/expenditures';

    const getAuthHeader = () => {
        if (user && user.token) {
            return { headers: { Authorization: `Bearer ${user.token}` } };
        }
        return {};
    };

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const header = getAuthHeader();
            const { data } = await axios.get(`${API_URL}?date=${filterDate}&branch=${selectedBranch}`, header);
            setExpenses(data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [filterDate, selectedBranch]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот расход?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`, getAuthHeader());
            alert('Расход удален');
            fetchExpenses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Ошибка при удалении');
        }
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const CATEGORIES = [
        'Аренда', 'Зарплата', 'Коммунальные', 'Маркетинг', 'Закупка', 'Логистика', 'Прочее'
    ];

    const filteredExpenses = expenses.filter(exp =>
        (exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterCategory === '' || exp.category === filterCategory)
    );

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Управление расходами</h1>
                    <p className="text-slate-500 text-sm">Просмотр и учет всех финансовых трат системы</p>
                </div>
                <button
                    onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-lg shadow-slate-200"
                >
                    <Plus size={20} />
                    <span>Добавить расход</span>
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <ReceiptText size={18} />
                        <span className="text-sm font-medium">Итого за сегодня</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-400 font-sans">сум</span>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск по названию или категории..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    >
                        <option value="">Все категории</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <BranchFilter />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Название</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Категория</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Сумма</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Дата</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">Записей не найдено</td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-sm text-slate-900">{expense.title}</div>
                                            {expense.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{expense.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">
                                            <div className="text-sm font-bold text-rose-600">
                                                -{expense.amount.toLocaleString()} <span className="text-[10px] font-normal font-sans">сум</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900">
                                            <div className="text-xs text-slate-600 font-medium">
                                                {new Date(expense.date).toLocaleDateString('ru-RU')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(expense)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <ExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchExpenses}
                expenseToEdit={editingExpense}
            />
        </div>
    );
};

export default Expenses;
