import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Quote, Plus, Edit, Trash2, X, Save, Search } from 'lucide-react';
import { getQuotes, createQuote, updateQuote, deleteQuote, reset } from '../features/quotes/quoteSlice';
import type { AppDispatch, RootState } from '../app/store';

const Quotes = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { quotes, isLoading, isSuccess, isError, message } = useSelector(
        (state: RootState) => state.quotes
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState('');
    const [text, setText] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('General');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getQuotes());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            alert(message);
            dispatch(reset());
        }
        if (isSuccess && (isModalOpen || isEditMode)) {
            closeModal();
            dispatch(reset());
        }
    }, [isError, isSuccess, message, dispatch]);

    const openModal = () => {
        setIsModalOpen(true);
        setIsEditMode(false);
        setText('');
        setAuthor('');
        setCategory('General');
    };

    const openEditModal = (quote: any) => {
        setIsModalOpen(true);
        setIsEditMode(true);
        setCurrentId(quote._id);
        setText(quote.text);
        setAuthor(quote.author);
        setCategory(quote.category || 'General');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentId('');
        setText('');
        setAuthor('');
        setCategory('General');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditMode) {
            dispatch(updateQuote({ id: currentId, quoteData: { text, author, category } }));
        } else {
            dispatch(createQuote({ text, author, category }));
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту цитату?')) {
            dispatch(deleteQuote(id));
        }
    };

    const filteredQuotes = quotes.filter((quote: any) =>
        quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Цитаты дня</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление ежедневными мотивационными цитатами</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm font-medium"
                >
                    <Plus size={18} />
                    Добавить цитату
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Поиск по тексту или автору..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map((quote: any) => (
                    <div key={quote._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <Quote size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                    {quote.category || 'General'}
                                </span>
                            </div>
                            <p className="text-slate-800 font-medium text-lg leading-relaxed mb-4">
                                "{quote.text}"
                            </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <p className="text-sm text-slate-500 font-medium italic">
                                — {quote.author}
                            </p>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(quote)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(quote._id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredQuotes.length === 0 && !isLoading && (
                <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                    Цитаты не найдены
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isEditMode ? 'Редактировать цитату' : 'Новая цитата'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Текст цитаты
                                </label>
                                <textarea
                                    required
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    rows={4}
                                    placeholder="Введите мудрую мысль..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Автор
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    placeholder="Например: Алишер Навоий"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Категория
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Например: Мотивация"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    'Сохранение...'
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Сохранить
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotes;
