import { useState, useEffect } from 'react';
import { ShoppingBag, Star, ReceiptText, BookOpen, Award, ThumbsUp } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import logo from '../assets/logo/logo.png';

const PosCustomerDisplay = () => {
    const [cart, setCart] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [branch, setBranch] = useState<any>(null);
    const [banners, setBanners] = useState<any[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const bc = new BroadcastChannel('pos-channel');

        bc.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CART') {
                setCart(event.data.cart);
                setTotalPrice(event.data.totalPrice);
                setBranch(event.data.branch);
                if (event.data.banners) {
                    setBanners(event.data.banners);
                }
            } else if (event.data.type === 'RESET') {
                setCart([]);
                setTotalPrice(0);
            }
        };

        return () => bc.close();
    }, []);

    // Auto-slide carousel
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % banners.length);
        }, 5000); // Change perfectly every 5 seconds
        return () => clearInterval(interval);
    }, [banners]);

    const benefits = [
        { icon: BookOpen, title: "Широкий выбор", desc: "Более 1000 книг в наличии" },
        { icon: Award, title: "100% Оригинал", desc: "Гарантия качества" },
        { icon: ThumbsUp, title: "Отличный сервис", desc: "Всегда рады помочь" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/20">
            {/* Header */}
            <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">Taalim Касса</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{branch?.name || 'Добро пожаловать'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Status</p>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            ОНЛАЙН
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex h-[calc(100vh-80px)] overflow-hidden">
                {/* Left side: Promotion/Branding */}
                <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-20 bg-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-transparent to-purple-50" />

                    {/* Background Watermark */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                        <img src={logo} alt="Watermark" className="w-full max-w-[80%] h-auto object-contain blur-[2px]" />
                    </div>

                    {/* Dynamic Banners or Default Layout */}
                    {banners.length > 0 ? (
                        <div className="relative z-10 w-full max-w-2xl">
                            <div className="relative aspect-[16/9] w-full rounded-t-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 bg-slate-100">
                                {banners.map((banner, idx) => (
                                    <div
                                        key={banner._id || idx}
                                        className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <ImageWithFallback
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-b-3xl p-8 shadow-xl shadow-slate-200/50 border border-t-0 border-slate-100 relative min-h-[160px] flex flex-col items-center justify-center text-center">
                                {banners.map((banner, idx) => (
                                    <div
                                        key={`text-${banner._id || idx}`}
                                        className={`absolute inset-0 p-8 flex flex-col items-center justify-center transition-all duration-700 ${idx === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                                    >
                                        <h2 className="text-2xl font-black text-slate-800 mb-2 truncate w-full" style={{ color: banner.color !== '#3B82F6' ? banner.color : undefined }}>{banner.title}</h2>
                                        <p className="text-sm font-medium text-slate-500 line-clamp-2 w-full">{banner.subtitle}</p>
                                    </div>
                                ))}

                                {/* Slide Indicators */}
                                {banners.length > 1 && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                        {banners.map((banner, idx) => (
                                            <div
                                                key={`dot-${idx}`}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeSlide ? 'w-6' : 'w-1.5 opacity-30'}`}
                                                style={{ backgroundColor: banner.color || '#6366f1' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 text-center max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-8 shadow-sm">
                                <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                                Магазин Премиум Книг
                            </div>
                            <h2 className="text-6xl font-black mb-6 leading-tight text-slate-800">
                                Учиться <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    Никогда Не
                                </span> <br />
                                Поздно
                            </h2>
                            <p className="text-xl text-slate-500 leading-relaxed mb-12 font-medium">
                                Покупайте лучшие произведения и учебные пособия по доступным ценам в нашем магазине.
                            </p>

                            <div className="grid grid-cols-3 gap-6">
                                {benefits.map((item, i) => (
                                    <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                            <item.icon size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Shopping Cart */}
                <div className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <ReceiptText className="w-6 h-6 text-indigo-600" />
                            <h3 className="text-xl font-bold text-slate-800">Ваша Корзина</h3>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold shadow-sm">
                            {cart.length} товаров
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <ShoppingBag className="w-16 h-16 mb-4 text-slate-300" />
                                <p className="text-slate-400 font-medium text-lg">Корзина пока пуста</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm animate-in slide-in-from-right duration-500">
                                    <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 shadow-inner">
                                        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold truncate text-sm mb-1 text-slate-800">{item.title}</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.qty} шт <span className="text-slate-400 font-normal">x {item.price.toLocaleString()}</span></p>
                                            <p className="font-bold text-indigo-600 text-sm">{(item.qty * item.price).toLocaleString()} сом</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-slate-500 font-bold text-lg">Итого к оплате:</span>
                            <span className="text-3xl font-black text-slate-900">{totalPrice.toLocaleString()} сом</span>
                        </div>
                        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6 opacity-20" />
                        <p className="text-xs text-slate-400 uppercase tracking-widest text-center font-bold">
                            Спасибо за покупку!
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PosCustomerDisplay;
