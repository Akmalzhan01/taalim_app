import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBooks, deleteBook, createBook, updateBook, reset } from '../features/books/bookSlice';
import { getCategories } from '../features/categories/categorySlice';
import { Plus, Trash2, Edit, X, BookOpen, Check, Search, Filter } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import ImageWithFallback from '../components/ImageWithFallback';

const Books = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { books, isLoading, isError, message } = useSelector(
        (state: RootState) => state.books
    );
    const { categories } = useSelector((state: RootState) => state.categories);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        author: '',
        price: '',
        description: '',
        genres: [] as string[],
        image: '',
        summary: '',
        soldCount: '0',
        isNew: false,
        size: '',
        coverType: '',
        ageLimit: '',
        countInStock: '0',
        minStockLimit: '5',
        costPrice: '',
        cashbackAmount: '',
        isBundle: false,
        bundleItems: [] as { product: string, qty: number, title: string }[]
    });
    const [isEditMode, setIsEditMode] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const uploadFileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);
            setUploading(true);
            try {
                const response = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                setFormData((prev) => ({ ...prev, image: data.url }));
                setUploading(false);
            } catch (error) {
                console.error(error);
                setUploading(false);
                alert('Ошибка при загрузке изображения');
            }
        }
    };

    useEffect(() => {
        if (isError) {
            alert(message);
        }
        dispatch(getBooks());
        dispatch(getCategories());
        return () => { dispatch(reset()); };
    }, [isError, message, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            dispatch(deleteBook(id));
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            title: '',
            author: '',
            price: '',
            description: '',
            genres: [],
            image: '',
            summary: '',
            soldCount: '0',
            isNew: false,
            size: '',
            coverType: '',
            ageLimit: '',
            countInStock: '0',
            minStockLimit: '5',
            costPrice: '',
            cashbackAmount: '',
            isBundle: false,
            bundleItems: []
        });
    };

    const openModal = (book?: any) => {
        if (book) {
            setFormData({
                id: book._id,
                title: book.title,
                author: book.author || 'Unknown',
                price: book.price.toString(),
                description: book.description,
                genres: book.genres || [],
                image: book.image || '',
                summary: book.summary || '',
                soldCount: book.soldCount ? book.soldCount.toString() : '0',
                isNew: book.isNew || false,
                size: book.size || '',
                coverType: book.coverType || '',
                ageLimit: book.ageLimit || '',
                countInStock: book.countInStock?.toString() || '0',
                minStockLimit: book.minStockLimit?.toString() || '5',
                costPrice: book.costPrice?.toString() || '',
                cashbackAmount: book.cashbackAmount?.toString() || '',
                isBundle: book.isBundle || false,
                bundleItems: book.bundleItems?.map((bi: any) => ({
                    product: bi.product?._id || bi.product,
                    qty: bi.qty,
                    title: bi.product?.title || 'Unknown Book'
                })) || []
            });
            setIsEditMode(true);
            setIsModalOpen(true);
        } else {
            resetForm();
            setIsEditMode(false);
            setIsModalOpen(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleGenre = (genreName: string) => {
        setFormData(prev => {
            const currentGenres = prev.genres;
            if (currentGenres.includes(genreName)) {
                return { ...prev, genres: currentGenres.filter(g => g !== genreName) };
            } else {
                return { ...prev, genres: [...currentGenres, genreName] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const bookData = {
            title: formData.title,
            author: formData.author,
            price: Number(formData.price),
            description: formData.description,
            genres: formData.genres,
            image: formData.image,
            summary: formData.summary,
            soldCount: Number(formData.soldCount),
            isNew: formData.isNew,
            size: formData.size,
            coverType: formData.coverType,
            ageLimit: formData.ageLimit,
            countInStock: Number(formData.countInStock),
            minStockLimit: Number(formData.minStockLimit),
            costPrice: Number(formData.costPrice),
            cashbackAmount: Number(formData.cashbackAmount),
            isBundle: formData.isBundle,
            bundleItems: formData.isBundle ? formData.bundleItems.map(item => ({
                product: item.product,
                qty: item.qty
            })) : []
        };

        if (isEditMode) {
            dispatch(updateBook({ id: formData.id, bookData }));
        } else {
            dispatch(createBook(bookData));
        }
        setIsModalOpen(false);
    };

    const filteredBooks = books.filter((book: any) => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesCategory = true;
        if (categoryFilter !== 'all') {
            matchesCategory = book.genres && book.genres.includes(categoryFilter);
        }

        return matchesSearch && matchesCategory;
    });

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px] text-slate-500 font-medium animate-pulse">Загрузка книг...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Каталог книг</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление ассортиментом библиотеки</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск по названию или автору..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer max-w-[200px]"
                        >
                            <option value="all">Все категории</option>
                            {categories.map((cat: any) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-500/20 active:scale-[0.98] transition-all font-medium text-sm whitespace-nowrap"
                    >
                        <Plus size={18} /> Добавить книгу
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Книга</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Автор</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden">Цена</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Склад</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Продано</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Price / Profit / Cashback
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-5">
                            {filteredBooks.map((book: any) => (
                                <tr key={book._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-16 w-12 relative shadow-sm rounded-lg overflow-hidden bg-slate-100 group-hover:shadow-md transition-all group-hover:-translate-y-0.5">
                                                {book.image ? (
                                                    <ImageWithFallback
                                                        src={book.image}
                                                        alt={book.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                        <span className="text-[10px]">HTML</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                                                    {book.title}
                                                    {book.isBundle && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider relative -top-0.5">Набор</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                                                    {book.genres && book.genres.length > 0 ? book.genres[0] : 'Без жанра'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-slate-600">
                                            {book.author || 'Неизвестно'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden"> {/* Hidden redundant price */}
                                        <span className="text-sm font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                            {book.price} сом
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${Number(book.countInStock) > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            {book.countInStock || 0} шт.
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${Number(book.soldCount) > 50 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            {book.soldCount || 0} шт.
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-medium text-slate-500">
                                                Цена: <span className="text-slate-900 font-bold">{book.price} с.</span>
                                            </div>
                                            <div className="text-xs font-medium text-emerald-600">
                                                Прибыль: <span className="font-bold">
                                                    {(book.price - (book.costPrice || 0) - (book.cashbackAmount || 0)).toLocaleString()} с.
                                                </span>
                                            </div>
                                            {book.cashbackAmount > 0 && (
                                                <div className="text-xs font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                                    Кешбек: {book.cashbackAmount} с.
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openModal(book)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Редактировать"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(book._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBooks.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <BookOpen size={24} className="opacity-50" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700">Книги не найдены</p>
                                            <p className="text-sm mt-1">Попробуйте изменить параметры поиска.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.1)] transform transition-transform scale-100 relative z-10 flex flex-col border border-slate-100">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{isEditMode ? 'Редактировать книгу' : 'Новая книга'}</h3>
                                <p className="text-xs text-slate-500 mt-1">Заполните информацию о книге</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Название книги</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="Например: Война и мир" required />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Автор</label>
                                    <input type="text" name="author" value={formData.author} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="Например: Лев Толстой" />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Цена ($)</label>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="0.00" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Продано (шт)</label>
                                        <input type="number" name="soldCount" value={formData.soldCount} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="0" />
                                    </div>
                                </div>

                                {/* New Fields: Size, Cover, Age */}
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Размер</label>
                                        <input type="text" name="size" value={formData.size} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="A5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Переплет</label>
                                        <select name="coverType" value={formData.coverType} onChange={(e) => setFormData({ ...formData, coverType: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 text-sm appearance-none">
                                            <option value="">Не указано</option>
                                            <option value="Мягкий">Мягкий</option>
                                            <option value="Твердый">Твердый</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Возраст</label>
                                        <input type="text" name="ageLimit" value={formData.ageLimit} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="12+" />
                                    </div>
                                </div>

                                {/* Inventory Fields */}
                                <div className="grid grid-cols-2 gap-5 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <h4 className="col-span-2 text-sm font-bold text-yellow-800 uppercase mb-1">Складской учет & Финансы</h4>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Себестоимость (сом)</label>
                                        <input type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="0" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Количество на складе</label>
                                        <input type="number" name="countInStock" value={formData.countInStock} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="0" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Мин. лимит (для уведомления)</label>
                                        <input type="number" name="minStockLimit" value={formData.minStockLimit} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wide ml-1">Кешбек клиенту (сом)</label>
                                        <input type="number" name="cashbackAmount" value={formData.cashbackAmount} onChange={handleInputChange} className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm" placeholder="0" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="isNew"
                                        name="isNew"
                                        checked={formData.isNew}
                                        onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                        className="w-5 h-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                                    />
                                    <label htmlFor="isNew" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                                        Отметить как "Новинка" (New)
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl border border-purple-200">
                                    <input
                                        type="checkbox"
                                        id="isBundle"
                                        name="isBundle"
                                        checked={formData.isBundle}
                                        onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-600 cursor-pointer"
                                    />
                                    <label htmlFor="isBundle" className="text-sm font-bold text-purple-900 cursor-pointer select-none">
                                        Сделать "Набором" (Комплект из нескольких книг)
                                    </label>
                                </div>

                                {formData.isBundle && (
                                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-3">
                                        <h4 className="text-xs font-bold text-purple-800 uppercase">Состав набора</h4>
                                        <div className="flex gap-2">
                                            <select
                                                id="bundleBookSelect"
                                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                                            >
                                                <option value="">Выберите книгу...</option>
                                                {books.filter((b: any) => !b.isBundle).map((b: any) => (
                                                    <option key={b._id} value={b._id}>{b.title} ({b.price} с)</option>
                                                ))}
                                            </select>
                                            <input type="number" id="bundleBookQty" min="1" defaultValue="1" className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-purple-500" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const select = document.getElementById('bundleBookSelect') as HTMLSelectElement;
                                                    const qty = document.getElementById('bundleBookQty') as HTMLInputElement;
                                                    if (select.value && qty.value) {
                                                        const option = select.options[select.selectedIndex];
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            bundleItems: [...prev.bundleItems, { product: select.value, qty: parseInt(qty.value), title: option.text.split(' (')[0] }]
                                                        }));
                                                        select.value = '';
                                                        qty.value = '1';
                                                    }
                                                }}
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition"
                                            >
                                                Добавить
                                            </button>
                                        </div>
                                        {formData.bundleItems.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {formData.bundleItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-2 border border-purple-100 rounded-lg text-sm">
                                                        <span className="font-medium text-slate-800 truncate pr-4">{item.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">{item.qty} шт</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        bundleItems: prev.bundleItems.filter((_, i) => i !== idx)
                                                                    }));
                                                                }}
                                                                className="text-rose-400 hover:text-rose-600 p-1"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Обложка книги</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="image"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                            placeholder="URL изображения..."
                                        />
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={uploadFileHandler}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploading}
                                            />
                                            <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-medium text-sm transition-colors border border-slate-200">
                                                {uploading ? '...' : 'Загрузить'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Жанры и Категории</label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {categories.map((cat: any) => {
                                            const isSelected = formData.genres.includes(cat.name);
                                            return (
                                                <button
                                                    type="button"
                                                    key={cat._id}
                                                    onClick={() => toggleGenre(cat.name)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isSelected
                                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 transform scale-105'
                                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    {isSelected && <Check size={12} />}
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                        {categories.length === 0 && <span className="text-xs text-slate-400">Нет доступных категорий. Создайте их в разделе "Категории".</span>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Краткое описание</label>
                                    <textarea name="summary" value={formData.summary} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm h-20 resize-none" placeholder="Краткое описание для карточки..." />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Полное описание</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm h-32 resize-none" placeholder="Полное описание книги..." required />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button type="submit" className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20">
                                        {isEditMode ? 'Сохранить изменения' : 'Создать книгу'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
