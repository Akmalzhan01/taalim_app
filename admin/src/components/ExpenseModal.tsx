import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, TrendingDown } from 'lucide-react';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expenseToEdit?: any;
    selectedBranch?: string;
}

const CATEGORIES = [
    'Аренда', 'Зарплата', 'Коммунальные', 'Маркетинг', 'Закупка', 'Логистика', 'Прочее'
];

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSuccess, expenseToEdit, selectedBranch }) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Прочее',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const API_URL = 'http://localhost:5000/api/expenditures';

    useEffect(() => {
        if (expenseToEdit) {
            setFormData({
                title: expenseToEdit.title,
                amount: expenseToEdit.amount.toString(),
                category: expenseToEdit.category,
                description: expenseToEdit.description || '',
                date: new Date(expenseToEdit.date).toISOString().split('T')[0]
            });
        } else {
            setFormData({
                title: '',
                amount: '',
                category: 'Прочее',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [expenseToEdit, isOpen]);

    const getAuthHeader = () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user && user.token) {
            return { headers: { Authorization: `Bearer ${user.token}` } };
        }
        return {};
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (selectedBranch) {
                (payload as any).branch = selectedBranch;
            }
            if (expenseToEdit) {
                await axios.put(`${API_URL}/${expenseToEdit._id}`, payload, getAuthHeader());
                alert('Расход обновлен');
            } else {
                await axios.post(API_URL, payload, getAuthHeader());
                alert('Расход добавлен');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Ошибка при сохранении');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingDown size={20} className="text-rose-500" />
                        {expenseToEdit ? 'Редактировать расход' : 'Новый расход'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg group">
                        <X size={20} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Название / Назначение</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Напр: Аренда офиса, Обед, Транспорт"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Сумма (сом)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Категория</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Дата</label>
                        <input
                            required
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Описание (необязательно)</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm resize-none"
                        />
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-bold text-sm shadow-lg shadow-rose-100"
                        >
                            {expenseToEdit ? 'Сохранить изменения' : 'Подтвердить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
