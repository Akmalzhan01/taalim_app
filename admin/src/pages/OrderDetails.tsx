import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, deliverOrder, getOrdersByUser, refundOrder } from '../features/orders/orderSlice';
import { Loader, ArrowLeft, MapPin, CreditCard, User, Mail, Calendar, CheckCircle, Package, History, ChevronDown } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import ImageWithFallback from '../components/ImageWithFallback';

const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { order, userOrders = [], isLoading, isError, message } = useSelector(
        (state: RootState) => state.orderList
    );

    const currentOrder = order as any || {};
    const { user } = currentOrder;

    useEffect(() => {
        if (id) {
            dispatch(getOrderDetails(id));
        }
    }, [dispatch, id]);

    // Fetch user history when user is available
    useEffect(() => {
        if (user && user._id) {
            dispatch(getOrdersByUser(user._id));
        }
    }, [dispatch, user?._id]); // Use optional chaining for safety

    const handleDeliver = () => {
        if (id) {
            dispatch(deliverOrder(id));
        }
    };

    const handleRefund = () => {
        if (id) {
            if (window.confirm("Вы уверены, что хотите оформить возврат? Товары вернутся на склад, а кэшбэк будет перерасчитан.")) {
                dispatch(refundOrder(id));
            }
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-slate-400" /></div>;
    if (isError) return <div className="text-center py-20 text-rose-500">{message}</div>;

    if (!currentOrder._id) return <div className="text-center py-20 text-slate-500">Заказ не найден</div>;

    const {
        _id,
        items: orderItems = [],
        shippingAddress,
        paymentMethod,
        itemsPrice,
        totalPrice,
        isPaid,
        paidAt,
        isDelivered,
        deliveredAt,
        isRefunded,
        refundedAt,
    } = currentOrder;

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/orders" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Заказ #{_id.substring(0, 10)}
                        {isRefunded && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-flex items-center gap-1"><History size={12} /> Возврат</span>}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Детали и статус заказа</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Summary (Like a Receipt) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Package size={18} className="text-indigo-600" /> Товары
                            </h3>
                            <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{orderItems.length} шт.</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {orderItems.map((item: any, index: number) => (
                                <div key={index} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{item.title}</p>
                                        <p className="text-sm text-slate-500">{item.qty} x {item.price} сом</p>
                                    </div>
                                    <div className="text-right font-bold text-slate-900">
                                        {(item.qty * item.price).toFixed(2)} сом
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50/50 p-6 space-y-3 border-t border-slate-100">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Подытог</span>
                                <span>{itemsPrice} сом</span>
                            </div>
                            {currentOrder.usedCashback > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Использован кэшбэк</span>
                                    <span>-{currentOrder.usedCashback} сом</span>
                                </div>
                            )}
                            {/* Shipping info removed as requested */}
                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-900">Итого</span>
                                <span className="font-bold text-xl text-indigo-600">{totalPrice} сом</span>
                            </div>
                        </div>
                    </div>

                    {/* User History Accordion */}
                    <details className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden group">
                        <summary className="p-6 cursor-pointer list-none flex justify-between items-center bg-slate-50/50 hover:bg-slate-100 transition-colors">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <History size={18} className="text-orange-500" /> История заказов клиента
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{userOrders.length}</span>
                                <ChevronDown size={20} className="text-slate-400 transform group-open:rotate-180 transition-transform" />
                            </div>
                        </summary>
                        <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                            {userOrders.filter((o: any) => o._id !== _id).map((histOrder: any) => (
                                <Link to={`/dashboard/orders/${histOrder._id}`} key={histOrder._id} className="block p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900 text-sm">#{histOrder._id.substring(0, 10)}</p>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(histOrder.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {histOrder.isPaid ? 'Оплачено' : 'Не оплачено'} • {histOrder.paymentMethod}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-sm">{histOrder.totalPrice} сом</p>
                                            {histOrder.isRefunded ? (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                                    Возврат
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${histOrder.isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {histOrder.isDelivered ? 'Доставлен' : 'В пути'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {userOrders.length <= 1 && (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    Нет других заказов
                                </div>
                            )}
                        </div>
                    </details>
                </div>

                {/* Right Column - Checklist & Actions */}
                <div className="space-y-6">
                    {/* Status Cards */}
                    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6 space-y-6">
                        {/* Customer */}
                        <div className="group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Клиент</p>
                                    <p className="font-medium text-slate-900">{user?.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                                        <Mail size={14} /> {user?.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Shipping */}
                        <div className="group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Доставка</p>
                                    <p className="font-medium text-slate-900 text-sm leading-relaxed">
                                        {shippingAddress?.address}
                                    </p>
                                    {isRefunded ? (
                                        <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <History size={12} /> Возврат {new Date(refundedAt).toLocaleDateString()}
                                        </div>
                                    ) : isDelivered ? (
                                        <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <CheckCircle size={12} /> Доставлено {new Date(deliveredAt).toLocaleDateString()}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <Calendar size={12} /> В пути / Обработка
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Payment */}
                        <div className="group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Оплата</p>
                                    <p className="font-medium text-slate-900">{paymentMethod}</p>
                                    {isPaid ? (
                                        <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <CheckCircle size={12} /> Оплачено {paidAt ? new Date(paidAt).toLocaleDateString() : ''}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-flex items-center gap-1">
                                            Не оплачено
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {!isDelivered && !isRefunded && (
                            <div className="pt-4">
                                <button
                                    onClick={handleDeliver}
                                    className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Отметить как доставленный
                                </button>
                                <p className="text-xs text-center text-slate-400 mt-3">
                                    Действие необратимо. Убедитесь, что клиент получил товар.
                                </p>
                            </div>
                        )}
                        {!isRefunded && (
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleRefund}
                                    className="w-full bg-rose-50 text-rose-600 font-bold py-3 px-4 rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <History size={18} />
                                    Оформить возврат
                                </button>
                                <p className="text-xs text-center text-slate-400 mt-3">
                                    Возврат товаров на склад и перерасчет кэшбэка.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
