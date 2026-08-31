import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Search, Plus, Trash2, Package, Check, BookPlus, Loader2, Truck, CreditCard } from 'lucide-react';
import { getAllBooks, createBook } from '../features/books/bookSlice';
import { getCategories } from '../features/categories/categorySlice';
import { createSupply, updateSupply } from '../features/supplies/supplySlice';
import { getVendors } from '../features/vendors/vendorSlice';
import type { AppDispatch, RootState } from '../app/store';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface SupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplyToEdit?: any;
}

const SupplyModal: React.FC<SupplyModalProps> = ({ isOpen, onClose, supplyToEdit }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { allBooks } = useSelector((state: RootState) => state.books);
    const { categories } = useSelector((state: RootState) => state.categories);
    const { isLoading: isSupplyLoading } = useSelector((state: RootState) => state.supplies);
    const { vendors } = useSelector((state: RootState) => state.vendors);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const [searchTerm, setSearchTerm] = useState('');
    const [basket, setBasket] = useState<any[]>([]);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [supplierPhone, setSupplierPhone] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'debt'>('paid');
    const [supplyType, setSupplyType] = useState<'purchase' | 'adjustment'>('purchase');

    const filteredSuppliers = supplierName
        ? vendors.filter((v: any) => v.name.toLowerCase().includes(supplierName.toLowerCase()) || (v.phone && v.phone.includes(supplierName)))
        : vendors.slice(0, 5); // Show top 5 if empty
    const [paidAmount, setPaidAmount] = useState('');
    const [uploading, setUploading] = useState(false);

    // Quick Add Form Data
    const [newBookData, setNewBookData] = useState({
        title: '',
        author: '',
        price: '',
        genres: [] as string[],
        description: '',
        summary: '',
        image: '',
        size: '',
        coverType: '',
        ageLimit: '',
        barcode: '',
        cashbackAmount: '0'
    });

    useEffect(() => {
        if (isOpen) {
            dispatch(getAllBooks(selectedBranch));
            dispatch(getCategories());
            dispatch(getVendors());
            if (supplyToEdit) {
                setSupplierName(supplyToEdit.supplierName || '');
                setSupplierPhone(supplyToEdit.supplierPhone || '');
                setPaymentStatus(supplyToEdit.paymentStatus || 'paid');
                setPaidAmount(supplyToEdit.paidAmount?.toString() || '');
                setSupplyType(supplyToEdit.type || 'purchase');
                setBasket(
                    (supplyToEdit.items || []).map((item: any) => ({
                        product: item.product?._id || item.product,
                        title: item.product?.title || 'Книга',
                        qty: item.qty,
                        purchasePrice: item.purchasePrice,
                    }))
                );
            } else {
                setSupplierName('');
                setSupplierPhone('');
                setPaymentStatus('paid');
                setPaidAmount('');
                setBasket([]);
            }
        }
    }, [isOpen, dispatch, selectedBranch, supplyToEdit]);

    const filteredBooks = allBooks.filter((book: any) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 5);

    const addToBasket = (book: any) => {
        const existing = basket.find(item => item.product === book._id);
        if (existing) {
            setBasket(basket.map(item =>
                item.product === book._id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setBasket([...basket, {
                product: book._id,
                title: book.title,
                qty: 1,
                purchasePrice: book.costPrice || 0
            }]);
        }
        setSearchTerm('');
    };

    const removeFromBasket = (productId: string) => {
        setBasket(basket.filter(item => item.product !== productId));
    };

    const updateBasketItem = (productId: string, field: string, value: any) => {
        setBasket(basket.map(item =>
            item.product === productId ? { ...item, [field]: value } : item
        ));
    };

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...newBookData,
            branch: selectedBranch,
            price: Number(newBookData.price),
            cashbackAmount: Number(newBookData.cashbackAmount),
            summary: newBookData.summary?.trim() || 'Новая книга (добавлена быстро)',
            description: newBookData.description?.trim() || 'Новая книга добавлена через приход',
            image: newBookData.image?.trim() || '',
            size: newBookData.size?.trim() || 'A5',
            coverType: newBookData.coverType?.trim() || 'Мягкий переплет',
            ageLimit: newBookData.ageLimit?.trim() || '0+',
            barcode: newBookData.barcode?.trim()
        };

        const resultAction = await dispatch(createBook(payload));

        if (createBook.fulfilled.match(resultAction)) {
            const createdBook = resultAction.payload;
            addToBasket(createdBook);
            setShowQuickAdd(false);
            setNewBookData({
                title: '',
                author: '',
                price: '',
                genres: [],
                description: '',
                summary: '',
                image: '',
                size: '',
                coverType: '',
                ageLimit: '',
                barcode: '',
                cashbackAmount: '0'
            });
        } else {
            alert('Ошибка при создании книги');
        }
    };

    const handleSubmitSupply = async () => {
        if (basket.length === 0) return;

        const totalAmount = basket.reduce((acc, item) => acc + (item.purchasePrice * item.qty), 0);
        const supplyData = {
            items: basket.map(item => ({
                product: item.product,
                qty: item.qty,
                purchasePrice: item.purchasePrice
            })),
            totalCost: totalAmount,
            totalAmount,
            date: new Date(),
            supplierName,
            supplierPhone,
            paymentStatus: supplyType === 'adjustment' ? 'paid' : paymentStatus,
            branch: selectedBranch,
            paidAmount: supplyType === 'adjustment' ? 0 : (Number(paidAmount) || 0),
            type: supplyType,
        };

        if (supplyToEdit) {
            const resultAction = await dispatch(updateSupply({ id: supplyToEdit._id, supplyData }));
            if (updateSupply.fulfilled.match(resultAction)) {
                alert('Приход успешно обновлён');
                onClose();
            } else {
                alert('Ошибка при обновлении');
            }
        } else {
            const resultAction = await dispatch(createSupply(supplyData));
            if (createSupply.fulfilled.match(resultAction)) {
                alert('Приход успешно завершен');
                setBasket([]);
                setSupplierName('');
                setSupplierPhone('');
                setPaymentStatus('paid');
                setPaidAmount('');
                setSupplyType('purchase');
                onClose();
            } else {
                alert('Произошла ошибка');
            }
        }
    };

    const uploadFileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            const BASE_URL = import.meta.env.VITE_API_URL || 'https://taalim-app.onrender.com/api';
            const { data } = await axios.post(`${BASE_URL}/upload`, formData, config);
            setNewBookData({ ...newBookData, image: data.url });
            toast.success('Изображение загружено');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Ошибка загрузки изображения');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] relative z-10 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Package size={24} className="text-indigo-600" />
                            {supplyToEdit ? 'Редактировать приход' : 'Новый Приход (Supply)'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{supplyToEdit ? 'Изменение данных прихода' : 'Прием товара и обновление базы'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setSupplyType('purchase')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${supplyType === 'purchase' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sotib olish
                            </button>
                            <button
                                onClick={() => setSupplyType('adjustment')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${supplyType === 'adjustment' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Korrektura
                            </button>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                {supplyType === 'adjustment' && (
                    <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                        <span className="text-amber-600 text-xs font-bold">Korrektura rejimi:</span>
                        <span className="text-amber-700 text-xs">Kitoblar skladga kiritiladi, lekin xarajat hisoblanmaydi (rashod yozilmaydi)</span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Search and Quick Add */}
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Поиск книги</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Название или автор..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                                />
                            </div>

                            {searchTerm && (
                                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {filteredBooks.length > 0 ? (
                                        filteredBooks.map((book: any) => (
                                            <button
                                                key={book._id}
                                                onClick={() => addToBasket(book)}
                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-10 bg-slate-100 rounded overflow-hidden">
                                                        {book.image && <img src={book.image} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{book.title}</p>
                                                        <p className="text-xs text-slate-500">{book.author}</p>
                                                    </div>
                                                </div>
                                                <Plus size={16} className="text-slate-300 group-hover:text-indigo-600" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-slate-500">Книга не найдена</p>
                                            <button
                                                onClick={() => { setShowQuickAdd(true); setSearchTerm(''); }}
                                                className="mt-2 text-indigo-600 font-bold text-xs flex items-center gap-1 mx-auto hover:underline"
                                            >
                                                <BookPlus size={14} /> Quick Add (Добавить новую)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {showQuickAdd && (
                            <form onSubmit={handleQuickAdd} className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                                        <BookPlus size={18} /> Быстрое добавление книги
                                    </h4>
                                    <button type="button" onClick={() => setShowQuickAdd(false)} className="text-emerald-400 hover:text-emerald-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Название книги"
                                        value={newBookData.title}
                                        onChange={(e) => setNewBookData({ ...newBookData, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Автор"
                                            value={newBookData.author}
                                            onChange={(e) => setNewBookData({ ...newBookData, author: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                        <input
                                            required
                                            type="number"
                                            placeholder="Цена продажи"
                                            value={newBookData.price}
                                            onChange={(e) => setNewBookData({ ...newBookData, price: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Штрихкод (Barcode)"
                                        value={newBookData.barcode}
                                        onChange={(e) => setNewBookData({ ...newBookData, barcode: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                            onChange={(e) => setNewBookData({ ...newBookData, genres: [e.target.value] })}
                                        >
                                            <option value="">Категория...</option>
                                            {categories.map((cat: any) => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3 pt-2 mt-2 border-t border-emerald-100">
                                        <p className="text-xs text-emerald-600/70 font-semibold uppercase tracking-wider mb-1">Дополнительно (необязательно)</p>

                                        <div className="grid grid-cols-3 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Размер (напр. A5)"
                                                value={newBookData.size}
                                                onChange={(e) => setNewBookData({ ...newBookData, size: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                                            />
                                            <select
                                                value={newBookData.coverType}
                                                onChange={(e) => setNewBookData({ ...newBookData, coverType: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                                            >
                                                <option value="">Переплет...</option>
                                                <option value="Мягкий переплет">Мягкий переплет</option>
                                                <option value="Твердый переплет">Твердый переплет</option>
                                                <option value="Не указано">Не указано</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Возраст (напр. 12+)"
                                                value={newBookData.ageLimit}
                                                onChange={(e) => setNewBookData({ ...newBookData, ageLimit: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-emerald-100 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1">
                                            <div>
                                                <label className="text-[10px] text-emerald-600 font-semibold uppercase mb-1 block">Кешбэк клиенту (сум)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Кешбэк (сум)"
                                                    value={newBookData.cashbackAmount}
                                                    onChange={(e) => setNewBookData({ ...newBookData, cashbackAmount: e.target.value })}
                                                    className="w-full px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="URL Обложки (необязательно)"
                                                value={newBookData.image}
                                                onChange={(e) => setNewBookData({ ...newBookData, image: e.target.value })}
                                                className="flex-1 px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={uploadFileHandler}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={uploading}
                                                />
                                                <button type="button" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-xl font-medium text-sm transition-colors border border-emerald-200 h-full whitespace-nowrap">
                                                    {uploading ? '...' : 'Загрузить'}
                                                </button>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Краткое описание (Summary)"
                                            value={newBookData.summary}
                                            onChange={(e) => setNewBookData({ ...newBookData, summary: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                        <textarea
                                            placeholder="Полное описание (Description)"
                                            value={newBookData.description}
                                            onChange={(e) => setNewBookData({ ...newBookData, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none h-20"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        Создать и добавить книгу
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                                <Package size={24} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Информация о приходе</p>
                            <p className="text-sm text-slate-400 mt-2 px-6">
                                Найдите книги через поиск и добавьте в корзину. Если книги нет в базе, используйте кнопку Quick Add.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Basket */}
                    <div className="flex flex-col h-full space-y-6">
                        <div className="flex justify-between items-center">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Корзина прихода</label>
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{basket.length} шт.</span>
                        </div>

                        <div className="flex-1 bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {basket.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <ShoppingCart size={40} className="text-slate-300 mb-2" />
                                        <p className="text-sm font-medium text-slate-400">Корзина пуста</p>
                                    </div>
                                ) : (
                                    basket.map((item) => (
                                        <div key={item.product} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="text-sm font-bold text-slate-900 line-clamp-1 flex-1 pr-4">{item.title}</p>
                                                <button onClick={() => removeFromBasket(item.product)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Кол-во</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.qty}
                                                        onChange={(e) => updateBasketItem(item.product, 'qty', parseInt(e.target.value))}
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Цена (Приход)</label>
                                                    <input
                                                        type="number"
                                                        value={item.purchasePrice}
                                                        onChange={(e) => updateBasketItem(item.product, 'purchasePrice', parseInt(e.target.value))}
                                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-emerald-600 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {basket.length > 0 && (
                                <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-4">
                                    {supplyType === 'purchase' && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                    <Truck size={14} className="text-indigo-500" /> Поставщик (Имя)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ф.И.О"
                                                    value={supplierName}
                                                    onChange={(e) => {
                                                        setSupplierName(e.target.value);
                                                        setShowSupplierDropdown(true);
                                                    }}
                                                    onFocus={() => setShowSupplierDropdown(true)}
                                                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                                />
                                                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-48 overflow-y-auto">
                                                        {filteredSuppliers.map((sup: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                                onClick={() => {
                                                                    setSupplierName(sup.name);
                                                                    setSupplierPhone(sup.phone || '');
                                                                    setShowSupplierDropdown(false);
                                                                }}
                                                            >
                                                                <p className="text-sm font-bold text-slate-900">{sup.name}</p>
                                                                {sup.phone && <p className="text-xs text-slate-500">{sup.phone}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                    <Truck size={14} className="text-indigo-500" /> Телефон
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="+998"
                                                    value={supplierPhone}
                                                    onChange={(e) => setSupplierPhone(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                    <CreditCard size={14} className="text-emerald-500" /> Статус оплаты
                                                </label>
                                                <select
                                                    value={paymentStatus}
                                                    onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'debt')}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-medium"
                                                >
                                                    <option value="paid">Оплачено (Naxd/Karta)</option>
                                                    <option value="debt">В долг (Qarz)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                    {paymentStatus === 'paid' ? 'Сумма оплаты' : 'Внесенная сумма'}
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={paidAmount}
                                                    onChange={(e) => setPaidAmount(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                    {supplyType === 'adjustment' && (
                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
                                            <span className="text-amber-600 text-xs">Korrektura: yetkazib beruvchi va to'lov ma'lumotlari saqlanmaydi. Faqat sklad yangilanadi.</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-sm font-medium text-slate-500">Общая сомма:</span>
                                        <span className="text-lg font-black text-slate-900">
                                            {basket.reduce((acc, item) => acc + (item.purchasePrice * item.qty), 0).toLocaleString()} сом
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSubmitSupply}
                                        disabled={isSupplyLoading}
                                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-200"
                                    >
                                        {isSupplyLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        {supplyToEdit ? 'Сохранить изменения' : 'Завершить приход'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simplified ShoppingCart icon since it was used in text
const ShoppingCart = ({ size, className }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

export default SupplyModal;
