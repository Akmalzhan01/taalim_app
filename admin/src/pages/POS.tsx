import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBooks } from '../features/books/bookSlice';
import { createOrderAdmin, reset, getZReport } from '../features/orders/orderSlice';
import { getSettings } from '../features/settings/settingSlice';
import { getBranches } from '../features/branches/branchSlice';
import BranchFilter from '../components/BranchFilter';

import ExpenseModal from '../components/ExpenseModal';
import { ShoppingCart, Search, Trash2, CreditCard, Banknote, Plus, Minus, CheckCircle, Printer, X, Clock, Pause, Edit2, TrendingDown } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import ImageWithFallback from '../components/ImageWithFallback';
import Receipt from '../components/Receipt';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';

const POS = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { books } = useSelector((state: RootState) => state.books);
    const { isSuccess, isError, message, zReport } = useSelector((state: RootState) => state.orderList);
    const { selectedBranch } = useSelector((state: RootState) => state.branches);

    const [cart, setCart] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userSearch, setUserSearch] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [useCashback, setUseCashback] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash or Card
    const [stockFilter, setStockFilter] = useState('in'); // 'all', 'in', 'out'
    const [isOrderProcessing, setIsOrderProcessing] = useState(false);

    // Receipt Modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Hold Order state
    const [heldCarts, setHeldCarts] = useState<any[]>(JSON.parse(localStorage.getItem('heldCarts') || '[]'));
    const [showHeldModal, setShowHeldModal] = useState(false);

    // Manual Discount state
    const [manualDiscount, setManualDiscount] = useState(0);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [tempDiscount, setTempDiscount] = useState('');

    // Custom Item state
    const [showCustomItemModal, setShowCustomItemModal] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    const [customItemQty, setCustomItemQty] = useState<number>(1);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Chek-${receiptData?.orderNumber || '0000'}`,
        onAfterPrint: () => handleCloseReceipt(),
    });

    // Z-Report state
    const [showZReportModal, setShowZReportModal] = useState(false);
    const zReportRef = useRef<HTMLDivElement>(null);

    const handlePrintZReport = useReactToPrint({
        contentRef: zReportRef,
        documentTitle: `Z-Report-${new Date().toLocaleDateString()}`,
    });

    const handleOpenZReport = () => {
        dispatch(getZReport(selectedBranch));
        setShowZReportModal(true);
    };

    // Expenditure State
    const [showExpModal, setShowExpModal] = useState(false);




    useEffect(() => {
        dispatch(getBranches());
        dispatch(getBooks(selectedBranch));
        dispatch(getSettings());
        dispatch(reset()); // Reset state on mount to avoid stale alerts
        return () => { dispatch(reset()); };
    }, [dispatch, selectedBranch]);

    useEffect(() => {
        localStorage.setItem('heldCarts', JSON.stringify(heldCarts));
    }, [heldCarts]);

    useEffect(() => {
        if (isSuccess && isOrderProcessing) {
            // Success: open receipt modal with captured cart data
            const subtotalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
            let cashbackDiscount = 0;
            if (useCashback && selectedUser?.cashbackBalance) cashbackDiscount = Math.min(selectedUser.cashbackBalance, subtotalAmount);
            let currentTotal = subtotalAmount - cashbackDiscount;
            let appliedManualDiscount = Math.min(manualDiscount, currentTotal);
            currentTotal -= appliedManualDiscount;

            setReceiptData({
                orderItems: cart,
                totalPrice: currentTotal,
                usedCashback: cashbackDiscount,
                manualDiscount: appliedManualDiscount,
                earnedCashback: selectedUser ? Math.floor(currentTotal * 0.05) : 0, // Simplified earned logic display
                paymentMethod,
                orderNumber: Math.floor(100000 + Math.random() * 900000).toString(),
                date: new Date().toISOString()
            });

            setShowReceiptModal(true);
            setIsOrderProcessing(false);
            dispatch(reset());
        }
        if (isError && isOrderProcessing) {
            alert(message);
            dispatch(reset());
            setIsOrderProcessing(false);
        }
    }, [isSuccess, isError, message, dispatch, isOrderProcessing, cart, useCashback, selectedUser, paymentMethod]);

    const handleCloseReceipt = () => {
        setShowReceiptModal(false);
        setCart([]);
        setSelectedUser(null);
        setUseCashback(false);
        setReceiptData(null);
        setManualDiscount(0);
        setTempDiscount('');
        dispatch(getBooks(selectedBranch)); // Refresh stock
    };

    const handleHoldCart = () => {
        if (cart.length === 0) return;
        const subtotalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
        const holdObj = {
            id: Date.now(),
            cart,
            selectedUser,
            useCashback,
            manualDiscount,
            time: new Date().toISOString(),
            subtotal: subtotalAmount
        };
        setHeldCarts([...heldCarts, holdObj]);
        setCart([]);
        setSelectedUser(null);
        setUseCashback(false);
        setManualDiscount(0);
        setTempDiscount('');
    };

    const handleRestoreCart = (heldObj: any) => {
        if (cart.length > 0) {
            const confirmReplace = window.confirm('Текущая корзина будет очищена. Продолжить?');
            if (!confirmReplace) return;
        }
        setCart(heldObj.cart);
        setSelectedUser(heldObj.selectedUser);
        setUseCashback(heldObj.useCashback);
        setManualDiscount(heldObj.manualDiscount || 0);
        setTempDiscount(heldObj.manualDiscount ? String(heldObj.manualDiscount) : '');
        setHeldCarts(heldCarts.filter(x => x.id !== heldObj.id));
        setShowHeldModal(false);
    };

    const handleAddCustomItem = () => {
        if (!customItemName || !customItemPrice || Number(customItemPrice) <= 0 || customItemQty <= 0) return;
        const newItem = {
            product: 'custom_' + Date.now(),
            title: customItemName,
            price: Number(customItemPrice),
            qty: Number(customItemQty),
            image: 'https://via.placeholder.com/150?text=Свой+товар',
            countInStock: 9999
        };
        setCart([...cart, newItem]);
        setShowCustomItemModal(false);
        setCustomItemName('');
        setCustomItemPrice('');
        setCustomItemQty(1);
    };

    // Search Users
    const searchUsersHandler = async (query: string) => {
        setUserSearch(query);
        if (query.length > 2) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/users', config);
                const filtered = data.filter((u: any) =>
                    u.name.toLowerCase().includes(query.toLowerCase()) ||
                    u.email.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 5);
                setUserSearchResults(filtered);
            } catch (error) {
                console.error(error);
            }
        } else {
            setUserSearchResults([]);
        }
    };

    const addToCart = (book: any) => {
        const existItem = cart.find((x) => x.product === book._id);
        if (existItem) {
            if (existItem.qty < book.countInStock) {
                setCart(cart.map((x) => (x.product === book._id ? { ...x, qty: x.qty + 1 } : x)));
            } else {
                alert('Больше нет в наличии');
            }
        } else {
            if (book.countInStock > 0) {
                setCart([...cart, {
                    product: book._id,
                    title: book.title,
                    price: book.price,
                    image: book.image,
                    qty: 1,
                    countInStock: book.countInStock
                }]);
            } else {
                alert('Нет в наличии');
            }
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter((x) => x.product !== id));
    };

    const updateQty = (id: string, qty: number) => {
        const item = cart.find(x => x.product === id);
        if (item && qty > 0 && qty <= item.countInStock) {
            setCart(cart.map((x) => (x.product === id ? { ...x, qty } : x)));
        }
    };

    // Barcode Scanner Global Listener
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // If more than 50ms passed between keys, it's likely human typing - clear buffer.
            if (currentTime - lastKeyTime.current > 50) {
                barcodeBuffer.current = '';
            }

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length >= 6) {
                    // Possible barcode scan
                    const scannedCode = barcodeBuffer.current.toUpperCase();

                    const foundBook = books.find((b: any) => b._id.toUpperCase().endsWith(scannedCode));

                    if (foundBook) {
                        addToCart(foundBook);
                    } else {
                        alert(`Товар со штрих-кодом ${scannedCode} не найден`);
                    }

                    barcodeBuffer.current = '';

                    // If focusing on some input while scanning, prevent its default behavior
                    if (document.activeElement?.tagName === 'INPUT') {
                        (document.activeElement as HTMLInputElement).blur();
                    }
                    e.preventDefault();
                } else {
                    barcodeBuffer.current = '';
                }
            } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                barcodeBuffer.current += e.key;
            }

            lastKeyTime.current = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [books, cart]);

    const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
    const tax = 0; // 0% tax for now
    let total = subtotal + tax;

    // Cashback logic
    let discount = 0;
    if (useCashback && selectedUser?.cashbackBalance) {
        discount = Math.min(selectedUser.cashbackBalance, total);
        total -= discount;
    }

    // Manual Discount logic
    let appliedManualDiscount = Math.min(manualDiscount, total);
    total -= appliedManualDiscount;

    const handleCheckout = () => {
        if (cart.length === 0) return;

        setIsOrderProcessing(true); // Start processing
        const orderData = {
            orderItems: cart,
            userId: selectedUser?._id,
            paymentMethod,
            totalPrice: total,
            useCashback,
            branch: selectedBranch
        };

        dispatch(createOrderAdmin(orderData));
    };

    const filteredBooks = books
        .filter((book: any) => book.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((book: any) => {
            if (stockFilter === 'in') return book.countInStock > 0;
            if (stockFilter === 'out') return book.countInStock === 0;
            return true;
        })
        .sort((a: any, b: any) => {
            if (a.countInStock > 0 && b.countInStock === 0) return -1;
            if (a.countInStock === 0 && b.countInStock > 0) return 1;
            return 0;
        });

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4 animate-in fade-in zoom-in duration-300 p-2">
            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Header Section */}
                <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-xl z-10 sticky top-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-1 gap-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Поиск товара..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 text-sm placeholder:text-slate-400"
                                />
                            </div>
                            <button onClick={() => setShowCustomItemModal(true)} title="Свободная цена / Свой товар" className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors group">
                                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        {/* Branch Filter */}
                        <BranchFilter label="" />

                        {/* Stock Filter Pills */}
                        <div className="flex gap-2 bg-slate-100/50 p-1 rounded-xl">
                            <button
                                onClick={() => setStockFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                            >
                                Все
                            </button>
                            <button
                                onClick={() => setStockFilter('in')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockFilter === 'in'
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                В наличии
                            </button>
                            <button
                                onClick={() => setStockFilter('out')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stockFilter === 'out'
                                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
                            >
                                Нет
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredBooks.map((book: any) => (
                            <div
                                key={book._id}
                                onClick={() => addToCart(book)}
                                className="group relative bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="aspect-[3/4] w-full overflow-hidden relative bg-slate-100">
                                    <ImageWithFallback
                                        src={book.image}
                                        alt={book.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    {/* Stock Badge */}
                                    <div className="absolute top-2 right-2">
                                        {book.countInStock > 0 ? (
                                            <span className="bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-slate-900 shadow-sm border border-white/20">
                                                {book.countInStock} шт.
                                            </span>
                                        ) : (
                                            <span className="bg-rose-500/90 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm">
                                                Нет
                                            </span>
                                        )}
                                    </div>

                                    {/* Price Tag (Floating) */}
                                    <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 shadow-sm border border-white/20 group-hover:scale-105 transition-transform">
                                        {book.price.toLocaleString()} с
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-2.5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {book.title}
                                    </h3>
                                    <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 font-medium">#{book._id.slice(-4).toUpperCase()}</span>
                                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-90">
                                            <Plus size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart & Checkout Sidebar */}
            <div className="w-[340px] flex flex-col bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
                {/* Cart Header */}
                <div className="p-4 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <ShoppingCart size={80} />
                    </div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur"><ShoppingCart size={18} /></span>
                            <h2 className="text-lg font-bold">Корзина</h2>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap justify-end mt-2 sm:mt-0">
                            <button onClick={() => setShowExpModal(true)} className="text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2 py-1.5 rounded-lg transition-colors flex gap-1 items-center whitespace-nowrap">
                                <TrendingDown size={14} /> Расход
                            </button>
                            <button onClick={handleOpenZReport} className="text-xs font-bold bg-white/10 px-2 py-1.5 rounded-lg hover:bg-white/20 transition-colors flex gap-1 items-center whitespace-nowrap">
                                <Printer size={14} /> Z-Отчет
                            </button>
                            <button onClick={() => setShowHeldModal(true)} className="text-xs font-bold bg-white/10 px-2 py-1.5 rounded-lg hover:bg-white/20 transition-colors flex gap-1 items-center relative whitespace-nowrap">
                                <Clock size={14} />
                                {heldCarts.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">{heldCarts.length}</span>}
                            </button>
                            <button onClick={handleHoldCart} disabled={cart.length === 0} className="text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1.5 rounded-lg transition-colors flex gap-1 items-center disabled:opacity-50">
                                <Pause size={14} /> Пауза
                            </button>
                            <span className="text-xs font-medium bg-white/10 px-2 py-1.5 rounded-lg ml-1">
                                {cart.length > 0 ? `${cart.length} шт` : '0'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* User Search / Selection */}
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        {selectedUser ? (
                            <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-indigo-100 shadow-sm group hover:border-indigo-300 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                        {selectedUser.name.charAt(0)}
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-sm font-bold text-slate-900 line-clamp-1">{selectedUser.name}</div>
                                        <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                                            Bal: {selectedUser.cashbackBalance?.toLocaleString()} с
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Клиент (кэшбэк)..."
                                        value={userSearch}
                                        onChange={(e) => searchUsersHandler(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                {userSearchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                        {userSearchResults.map(u => (
                                            <div key={u._id} onClick={() => { setSelectedUser(u); setUserSearchResults([]); setUserSearch(''); }} className="p-2 hover:bg-slate-50 cursor-pointer rounded-lg flex items-center gap-2 transition-colors">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900">{u.name}</div>
                                                    <div className="text-[10px] text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8FAFC]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <ShoppingCart size={32} className="mb-2" />
                            <p className="text-sm font-medium text-slate-500">Корзина пуста</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product} className="flex gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm relative group hover:border-indigo-100 transition-colors">
                                <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug pr-6">{item.title}</h4>
                                        <div className="text-[10px] text-indigo-600 font-bold">
                                            {(item.price).toLocaleString()} с
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                            <button onClick={() => updateQty(item.product, item.qty - 1)} className="w-5 h-5 rounded-md bg-white text-slate-600 flex items-center justify-center shadow-sm hover:text-rose-600 hover:shadow active:scale-95 transition-all"><Minus size={10} /></button>
                                            <span className="text-xs font-bold w-4 text-center text-slate-900">{item.qty}</span>
                                            <button onClick={() => updateQty(item.product, item.qty + 1)} className="w-5 h-5 rounded-md bg-white text-slate-600 flex items-center justify-center shadow-sm hover:text-emerald-600 hover:shadow active:scale-95 transition-all"><Plus size={10} /></button>
                                        </div>
                                        <div className="font-bold text-slate-900 text-sm">
                                            {(item.price * item.qty).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product)}
                                    className="absolute -top-1.5 -right-1.5 bg-white text-rose-500 p-1 rounded-full shadow-md border border-rose-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white transform hover:scale-110"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Section - Fixed Bottom */}
                <div className="bg-white p-4 border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                    <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                            <span>Подытог</span>
                            <span className="text-slate-900 font-bold">{subtotal.toLocaleString()} с</span>
                        </div>

                        {selectedUser && selectedUser.cashbackBalance > 0 && (
                            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-between cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setUseCashback(!useCashback)}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useCashback ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {useCashback && <CheckCircle size={10} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-medium text-indigo-900">Списать ({selectedUser.cashbackBalance.toLocaleString()})</span>
                                </div>
                                {useCashback && <span className="text-rose-500 text-xs font-bold">-{discount.toLocaleString()}</span>}
                            </div>
                        )}

                        {manualDiscount > 0 ? (
                            <div className="flex justify-between text-xs font-medium text-rose-500 items-center">
                                <button onClick={() => setShowDiscountModal(true)} className="flex items-center gap-1 hover:text-rose-600 transition-colors">Скидка (ручная) <Edit2 size={12} /></button>
                                <span className="font-bold">-{appliedManualDiscount.toLocaleString()} с</span>
                            </div>
                        ) : (
                            <div className="flex justify-between text-xs font-medium text-slate-500 items-center">
                                <button onClick={() => setShowDiscountModal(true)} className="flex items-center gap-1 hover:text-indigo-600 transition-colors tracking-wide text-[11px]"><Plus size={10} /> Скидка</button>
                            </div>
                        )}

                        <div className="flex justify-between items-end pt-1">
                            <span className="text-sm font-bold text-slate-500">Итого:</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{total.toLocaleString()} <span className="text-sm text-slate-400 font-medium">с</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                            onClick={() => setPaymentMethod('Cash')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${paymentMethod === 'Cash'
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Banknote size={16} className={paymentMethod === 'Cash' ? 'text-emerald-600' : 'text-slate-400'} />
                            Наличные
                        </button>
                        <button
                            onClick={() => setPaymentMethod('Card')}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${paymentMethod === 'Card'
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <CreditCard size={16} className={paymentMethod === 'Card' ? 'text-indigo-600' : 'text-slate-400'} />
                            Карта
                        </button>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isOrderProcessing}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-[0.98] ${cart.length === 0 || isOrderProcessing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        {isOrderProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                <span>Продать</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && receiptData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle size={20} />
                                <h3 className="font-bold">Оплата прошла успешно!</h3>
                            </div>
                            <button onClick={handleCloseReceipt} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Receipt Preview Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 flex justify-center custom-scrollbar">
                            <div className="shadow-lg border border-slate-200 bg-white">
                                {/* The actual receipt component */}
                                <Receipt ref={receiptRef} orderContext={receiptData} />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                            <button
                                onClick={handleCloseReceipt}
                                className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Закрыть
                            </button>

                            <button
                                onClick={handlePrint}
                                className="flex-[2] py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            >
                                <Printer size={18} />
                                <span>Печать чека</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Held Carts Modal */}
            {showHeldModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800"><Clock size={20} /> Отложенные чеки</h3>
                            <button onClick={() => setShowHeldModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                            {heldCarts.length === 0 ? (
                                <div className="text-center text-slate-400 py-8">Пусто</div>
                            ) : (
                                <div className="space-y-3">
                                    {heldCarts.map(h => (
                                        <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-indigo-300 transition-colors flex flex-col gap-2">
                                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{new Date(h.time).toLocaleTimeString('ru-RU')}</span>
                                                <span className="font-black text-indigo-600 text-lg">{h.subtotal.toLocaleString()} с</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-700">Товаров: {h.cart.reduce((a: any, c: any) => a + c.qty, 0)} шт</div>
                                            {h.selectedUser && <div className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg inline-block self-start">Клиент: {h.selectedUser.name}</div>}
                                            {h.manualDiscount > 0 && <div className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg inline-block self-start">Скидка: {h.manualDiscount} с</div>}
                                            <div className="flex gap-2 pt-2 mt-1 border-t border-slate-50">
                                                <button onClick={() => handleRestoreCart(h)} className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white py-1.5 rounded-lg text-sm font-bold transition-all">
                                                    Восстановить
                                                </button>
                                                <button onClick={() => setHeldCarts(heldCarts.filter(x => x.id !== h.id))} className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white px-3 rounded-lg transition-all flex justify-center items-center">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800">Ручная скидка (с)</h3>
                            <button onClick={() => setShowDiscountModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <input
                                    type="number"
                                    value={tempDiscount}
                                    onChange={(e) => setTempDiscount(e.target.value)}
                                    placeholder="Сумма скидки..."
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setManualDiscount(0); setTempDiscount(''); setShowDiscountModal(false); }} className="bg-rose-50 text-rose-600 font-bold px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-colors">Сброс</button>
                                <button onClick={() => { setManualDiscount(Number(tempDiscount) || 0); setShowDiscountModal(false); }} className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all">Применить</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Item Modal */}
            {showCustomItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800">Добавить свой товар</h3>
                            <button onClick={() => setShowCustomItemModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Название товара</label>
                                <input
                                    type="text"
                                    value={customItemName}
                                    onChange={(e) => setCustomItemName(e.target.value)}
                                    placeholder="Например: Пакет"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Цена (с)</label>
                                    <input
                                        type="number"
                                        value={customItemPrice}
                                        onChange={(e) => setCustomItemPrice(e.target.value)}
                                        placeholder="0"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Кол-во шт.</label>
                                    <input
                                        type="number"
                                        value={customItemQty}
                                        onChange={(e) => setCustomItemQty(Number(e.target.value))}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button onClick={handleAddCustomItem} disabled={!customItemName || !customItemPrice || Number(customItemPrice) <= 0 || customItemQty <= 0} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none">Добавить в корзину</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Z-Report Modal */}
            {showZReportModal && zReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800"><Printer size={20} /> Z-Отчет (Смена)</h3>
                            <button onClick={() => setShowZReportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 flex justify-center custom-scrollbar">
                            <div className="shadow-lg border border-slate-200 bg-white p-6 w-[300px] text-sm font-mono text-slate-900" ref={zReportRef}>
                                <div className="text-center font-bold text-base mb-2">Taalim Kitob Olami</div>
                                <div className="text-center text-xs mb-4">Z-Отчет (Конец смены)</div>
                                <div className="text-xs mb-4">Дата: {new Date(zReport.date).toLocaleDateString()}</div>

                                <div className="border-t border-dashed border-slate-300 py-2 space-y-1">
                                    <div className="flex justify-between"><span>Продажи:</span> <span>{zReport.orderCount} шт</span></div>
                                    <div className="flex justify-between"><span>Возвраты:</span> <span>{zReport.refundCount} шт</span></div>
                                </div>
                                <div className="border-t border-dashed border-slate-300 py-2 space-y-1">
                                    <div className="flex justify-between"><span>Наличные:</span> <span>{zReport.totalCash.toLocaleString()} с</span></div>
                                    <div className="flex justify-between"><span>Карта:</span> <span>{zReport.totalCard.toLocaleString()} с</span></div>
                                </div>
                                <div className="border-t border-dashed border-slate-300 py-2 space-y-1">
                                    <div className="flex justify-between font-bold"><span>ИТОГО КАССА:</span> <span>{zReport.totalSales.toLocaleString()} с</span></div>
                                    <div className="flex justify-between text-rose-600"><span>Сумма возвратов:</span> <span>-{zReport.totalRefunds.toLocaleString()} с</span></div>
                                    <div className="flex justify-between text-rose-600"><span>Сумма расходов:</span> <span>-{zReport.totalExpenditures?.toLocaleString() || 0} с</span></div>
                                </div>
                                <div className="border-t border-slate-800 mt-2 pt-2 space-y-1">
                                    <div className="flex justify-between font-black text-lg text-emerald-700"><span>ЧИСТАЯ КАССА:</span> <span>{(zReport.netProfit || (zReport.totalSales - zReport.totalRefunds)).toLocaleString()} с</span></div>
                                </div>
                                <div className="border-t border-slate-800 mt-4 pt-4 text-center text-[10px]">
                                    Отчет сформирован: {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowZReportModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Закрыть</button>
                            <button onClick={handlePrintZReport} className="flex-[2] py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all">
                                <Printer size={18} /> Печать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ExpenseModal
                isOpen={showExpModal}
                onClose={() => setShowExpModal(false)}
                onSuccess={() => dispatch(getZReport(selectedBranch))}
                selectedBranch={selectedBranch}
            />
        </div>
    );
};

export default POS;
