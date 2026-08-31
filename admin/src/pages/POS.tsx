import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { getBooks } from '../features/books/bookSlice';
import { API_URL } from '../config/constants';
import { createOrderAdmin, reset, getZReport } from '../features/orders/orderSlice';
import { getSettings } from '../features/settings/settingSlice';
import { getBranches } from '../features/branches/branchSlice';
import { getBanners } from '../features/banners/bannerSlice';
import { getCustomers, searchCustomerByPhone, createCustomer, resetSearch, setSearchedCustomer } from '../features/customers/customerSlice';
import BranchFilter from '../components/BranchFilter';

import ExpenseModal from '../components/ExpenseModal';
import { ShoppingCart, Search, Trash2, CreditCard, Banknote, Plus, Minus, CheckCircle, Printer, X, Clock, Pause, TrendingDown, Monitor, UserPlus, Phone, User as UserIcon } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import ImageWithFallback from '../components/ImageWithFallback';
import Pagination from '../components/Pagination';
import Receipt from '../components/Receipt';
import { useReactToPrint } from 'react-to-print';

const PAGE_SIZE = 24;

const POS = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { books, pages, total: totalBooks, isLoading } = useSelector((state: RootState) => state.books);
    const { isSuccess, isError, message, zReport } = useSelector((state: RootState) => state.orderList);
    const { selectedBranch, branches } = useSelector((state: RootState) => state.branches);
    const { banners } = useSelector((state: RootState) => state.banners);
    const { customers, searchedCustomer } = useSelector((state: RootState) => state.customers);

    const [cart, setCart] = useState<any[]>([]);

    // BroadcastChannel for Customer Display
    useEffect(() => {
        const bc = new BroadcastChannel('pos-channel');
        const currentBranch = (branches as any[]).find(b => b._id === selectedBranch);

        const activeBanners = (banners as any[]).filter(b => b.isActive);

        bc.postMessage({
            type: 'UPDATE_CART',
            cart,
            totalPrice: cart.reduce((acc, item) => acc + item.qty * item.price, 0),
            branch: currentBranch,
            banners: activeBanners,
            customer: searchedCustomer // Pass customer info to customer screen
        });

        return () => bc.close();
    }, [cart, selectedBranch, branches, banners, searchedCustomer]);

    const openCustomerDisplay = () => {
        window.open('/pos-customer', '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no');
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash or Card
    const [stockFilter, setStockFilter] = useState('in'); // 'all', 'in', 'out'
    const [isOrderProcessing, setIsOrderProcessing] = useState(false);

    // Customer Loyalty state
    const [customerPhone, setCustomerPhone] = useState('');
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    const filteredCustomersList = customerPhone
        ? customers.filter((c: any) =>
            c.name.toLowerCase().includes(customerPhone.toLowerCase()) ||
            c.phone.includes(customerPhone)
        )
        : [];

    // Receipt Modal state
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Hold Order state
    const [heldCarts, setHeldCarts] = useState<any[]>(JSON.parse(localStorage.getItem('heldCarts') || '[]'));
    const [showHeldModal, setShowHeldModal] = useState(false);

    // Manual Discount state
    const [manualDiscount, setManualDiscount] = useState(0);

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
        dispatch(getSettings());
        dispatch(getBanners());
        dispatch(getCustomers());
        dispatch(reset()); // Reset state on mount to avoid stale alerts
        return () => { dispatch(reset()); };
    }, [dispatch, selectedBranch]);

    // Typing should not fire one request per keystroke
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Any change of filter starts reading from the first page again
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, stockFilter, selectedBranch]);

    const loadBooks = useCallback(() => {
        dispatch(getBooks({
            branch: selectedBranch,
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch,
            stock: stockFilter as 'all' | 'in' | 'out',
            sort: 'stock'
        }));
    }, [dispatch, selectedBranch, page, debouncedSearch, stockFilter]);

    useEffect(() => { loadBooks(); }, [loadBooks]);

    // A sale that empties the last page must not strand us on an empty one
    useEffect(() => {
        if (page > pages) setPage(pages);
    }, [page, pages]);

    useEffect(() => {
        localStorage.setItem('heldCarts', JSON.stringify(heldCarts));
    }, [heldCarts]);

    useEffect(() => {
        if (isSuccess && isOrderProcessing) {
            // Success: open receipt modal with captured cart data
            const subtotalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
            let appliedManualDiscount = Math.min(manualDiscount, subtotalAmount);
            let currentTotal = subtotalAmount - appliedManualDiscount;

            setReceiptData({
                orderItems: cart,
                totalPrice: currentTotal,
                usedCashback: 0,
                manualDiscount: appliedManualDiscount,
                earnedCashback: 0, // Simplified earned logic display
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
    }, [isSuccess, isError, message, dispatch, isOrderProcessing, cart, paymentMethod, searchedCustomer, selectedBranch]);

    const handleCustomerSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Fallback for enter key if only one result
        if (filteredCustomersList.length === 1) {
            dispatch(setSearchedCustomer(filteredCustomersList[0]));
            setCustomerPhone('');
        } else if (customerPhone && customers.length === 0) {
            dispatch(searchCustomerByPhone(customerPhone));
        }
    };

    const handleCreateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCustomerName && newCustomerPhone) {
            dispatch(createCustomer({
                name: newCustomerName,
                phone: newCustomerPhone,
                branch: selectedBranch
            }));
            setShowCustomerModal(false);
            setNewCustomerName('');
            setNewCustomerPhone('');
            setCustomerPhone(newCustomerPhone);
        }
    };

    const handleCloseReceipt = () => {
        setShowReceiptModal(false);
        setCart([]);
        setReceiptData(null);
        setManualDiscount(0);
        loadBooks(); // Refresh stock
    };

    const handleHoldCart = () => {
        if (cart.length === 0) return;
        const subtotalAmount = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
        const holdObj = {
            id: Date.now(),
            cart,
            manualDiscount,
            time: new Date().toISOString(),
            subtotal: subtotalAmount
        };
        setHeldCarts([...heldCarts, holdObj]);
        setCart([]);
        setManualDiscount(0);
    };

    const handleRestoreCart = (heldObj: any) => {
        if (cart.length > 0) {
            const confirmReplace = window.confirm('Текущая корзина будет очищена. Продолжить?');
            if (!confirmReplace) return;
        }
        setCart(heldObj.cart);
        setManualDiscount(heldObj.manualDiscount || 0);
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
            image: '',
            countInStock: 9999
        };
        setCart([...cart, newItem]);
        setShowCustomItemModal(false);
        setCustomItemName('');
        setCustomItemPrice('');
        setCustomItemQty(1);
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

    // The scanned book is often not on the page being shown, so fall back to the server
    const findBookByCode = useCallback(async (code: string) => {
        const matches = (b: any) =>
            (b.barcode && b.barcode.toUpperCase() === code) || b._id.toUpperCase().endsWith(code);

        const onPage = (books as any[]).find(matches);
        if (onPage) return onPage;

        const params = new URLSearchParams({ showAll: 'true', code });
        if (selectedBranch) params.set('branch', selectedBranch);
        const { data } = await axios.get(`${API_URL}/books?${params.toString()}`);
        const results = Array.isArray(data) ? data : data.books;
        return results.find(matches) || null;
    }, [books, selectedBranch]);

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

                    findBookByCode(scannedCode)
                        .then((foundBook) => {
                            if (foundBook) {
                                addToCart(foundBook);
                            } else {
                                alert(`Товар со штрих-кодом ${scannedCode} не найден`);
                            }
                        })
                        .catch(() => alert(`Не удалось найти товар со штрих-кодом ${scannedCode}`));

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
    }, [findBookByCode, cart]);

    const subtotal = cart.reduce((acc, item) => acc + item.qty * item.price, 0);
    const tax = 0; // 0% tax for now
    let total = subtotal + tax;

    // Manual Discount logic
    let appliedManualDiscount = Math.min(manualDiscount, total);
    total -= appliedManualDiscount;

    const handleCheckout = () => {
        if (cart.length === 0) return;

        if (!selectedBranch) {
            alert('Iltimos, avval tepadan qaysi filialda ekanligingizni aniq tanlang ("Barcha filiallar" o\'rniga bitta filialni tanlang).');
            return;
        }

        setIsOrderProcessing(true); // Start processing
        const orderData: any = {
            orderItems: cart,
            customerId: searchedCustomer?._id, // [NEW] Link CRM Customer
            paymentMethod,
            totalPrice: total,
            branch: selectedBranch
        };

        dispatch(createOrderAdmin(orderData));
    };

    // Search, stock filter, ordering and paging all happen on the server now
    const filteredBooks = books as any[];

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4 animate-in fade-in zoom-in duration-300 p-2">
            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Header Section */}
                <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-xl z-10 sticky top-0">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex flex-1 gap-2">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
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
                    {isLoading && (
                        <p className="py-10 text-center text-sm font-medium text-slate-400 animate-pulse">Загрузка товаров...</p>
                    )}
                    {!isLoading && filteredBooks.length === 0 && (
                        <p className="py-10 text-center text-sm font-medium text-slate-400">Товары не найдены</p>
                    )}
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

                <Pagination
                    page={page}
                    pages={pages}
                    total={totalBooks}
                    limit={PAGE_SIZE}
                    onChange={setPage}
                    itemLabel="товаров"
                    compact
                />
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
                            <button onClick={openCustomerDisplay} className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors flex gap-1 items-center whitespace-nowrap" title="Открыть экран для клиента">
                                <Monitor size={14} /> Экран клиента
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

                {/* Receipt and Cart Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Customer Selection [NEW] */}
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        {!searchedCustomer ? (
                            <div className="relative">
                                <form onSubmit={handleCustomerSearch} className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Поиск клиента (имя, тел)..."
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                        />
                                    </div>
                                    <button type="submit" className="bg-white text-slate-600 border border-slate-200 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                                        <Search size={18} />
                                    </button>
                                    <button type="button" onClick={() => setShowCustomerModal(true)} className="bg-indigo-600 text-white px-3 rounded-xl hover:bg-indigo-700 transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </form>
                                {customerPhone && filteredCustomersList.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                        {filteredCustomersList.map((c: any) => (
                                            <div
                                                key={c._id}
                                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                                onClick={() => {
                                                    dispatch(setSearchedCustomer(c));
                                                    setCustomerPhone('');
                                                }}
                                            >
                                                <div className="text-sm font-bold text-slate-800">{c.name}</div>
                                                <div className="text-xs text-slate-500 font-medium">{c.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                                        <UserIcon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{searchedCustomer.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">LOYALTY</span>
                                            <p className="text-[11px] text-slate-500 font-medium">Всего: {searchedCustomer.totalPurchasedAmount?.toLocaleString()} сом</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { dispatch(resetSearch()); setCustomerPhone(''); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-2 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <ShoppingCart size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Корзина</h3>
                                <p className="text-[11px] text-slate-500 font-medium">{cart.length} шт.</p>
                            </div>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                            >
                                <Trash2 size={16} /> Очистить
                            </button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F8FAFC]">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <ShoppingCart size={32} className="mb-2" />
                                <p className="text-sm font-medium text-slate-500">Корзина пуста</p>
                            </div>
                        ) : (
                            cart.map((item, index) => (
                                <div key={index} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex gap-3 group animate-in slide-in-from-right-2 duration-300">
                                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-100 shadow-sm">
                                        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                                            <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{item.price.toLocaleString()} с</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-lg">
                                                <button onClick={() => updateQty(item.product, item.qty - 1)} className="p-0.5 hover:text-indigo-600 hover:bg-white rounded transition-all"><Minus size={12} /></button>
                                                <span className="text-[11px] font-bold text-slate-700 min-w-4 text-center">{item.qty}</span>
                                                <button onClick={() => updateQty(item.product, item.qty + 1)} className="p-0.5 hover:text-indigo-600 hover:bg-white rounded transition-all"><Plus size={12} /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"><X size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-500">
                            <span>Промежуточный итог</span>
                            <span>{subtotal.toLocaleString()} с</span>
                        </div>

                        {/* Manual Discount Section */}
                        <div className="flex items-center justify-between p-1 bg-indigo-50/50 border border-indigo-100/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <TrendingDown size={14} className="text-indigo-500" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Скидка:</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={manualDiscount || ''}
                                    onChange={(e) => setManualDiscount(Number(e.target.value))}
                                    className="w-20 px-2 py-1 bg-white border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    placeholder="0"
                                />
                                <span className="text-[10px] font-bold text-slate-400">som</span>
                            </div>
                        </div>

                        {appliedManualDiscount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg">
                                <span>Ручная скидка</span>
                                <span>-{appliedManualDiscount.toLocaleString()} с</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-800">Итого</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{total.toLocaleString()} <span className="text-xs font-bold text-slate-400">с</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                            onClick={() => setPaymentMethod('Cash')}
                            className={`flex flex-col items-center justify-center p-1 rounded-2xl border-2 transition-all ${paymentMethod === 'Cash'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                        >
                            <Banknote size={20} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Наличные</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod('Card')}
                            className={`flex flex-col items-center justify-center p-1 rounded-2xl border-2 transition-all ${paymentMethod === 'Card'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                        >
                            <CreditCard size={20} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Карта</span>
                        </button>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isOrderProcessing}
                        className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${cart.length === 0 || isOrderProcessing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-500/20 active:translate-y-0.5'}`}
                    >
                        {isOrderProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                <span>Оформить продажу</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal Sections */}
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

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleCloseReceipt}></div>
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-6 overflow-y-auto max-h-[80vh]">
                            <Receipt ref={receiptRef} orderContext={receiptData} />
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Printer size={18} />
                                Печать
                            </button>
                            <button
                                onClick={handleCloseReceipt}
                                className="px-6 bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
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

            {/* Customer Add Modal [NEW] */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCustomerModal(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <UserPlus size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Новый клиент</h3>
                            </div>
                            <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Имя клиента</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                    placeholder="Например: Иван Иванов"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Номер телефона</label>
                                <input
                                    type="text"
                                    required
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium"
                                    placeholder="998901234567"
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-4">
                                Bazaga Qo'shish
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
