import { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

interface ReceiptProps {
    orderContext: {
        orderItems: any[];
        totalPrice: number;
        usedCashback: number;
        earnedCashback: number;
        paymentMethod: string;
        orderNumber?: string;
        date: string;
    }
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ orderContext }, ref) => {
    const { settings } = useSelector((state: RootState) => state.settings);

    // Default config if settings not yet loaded
    const config = settings?.receiptSettings || {
        printerSize: '80mm',
        headerText: 'Taalim Kitob Olami',
        footerText: 'Xaridingiz uchun rahmat!',
        showLogo: true,
        showCashbackInfo: true,
        showBarcode: true,
    };

    const widthClass = config.printerSize === '58mm' ? 'w-[58mm]' : config.printerSize === 'A4' ? 'w-[210mm]' : 'w-[80mm]';
    const textSize = config.printerSize === 'A4' ? 'text-sm' : 'text-xs';

    return (
        <div ref={ref} className={`bg-white text-black p-4 mx-auto ${widthClass} font-mono leading-tight`} style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>

            {/* Header */}
            <div className="text-center mb-4">
                {config.showLogo && (
                    <div className="flex justify-center mb-2">
                        {/* Fake logo placeholder for receipt */}
                        <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-bold text-xl">
                            TK
                        </div>
                    </div>
                )}
                <h1 className="font-bold text-lg uppercase">{config.headerText}</h1>
                <p className={`${textSize} mt-1`}>{new Date(orderContext.date).toLocaleString('ru-RU')}</p>
                {orderContext.orderNumber && <p className={`${textSize} mt-1`}>Чек №: {orderContext.orderNumber}</p>}
            </div>

            <div className="border-b border-black border-dashed my-2"></div>

            {/* Items */}
            <table className={`w-full ${textSize} mb-2`}>
                <thead>
                    <tr className="border-b border-black">
                        <th className="text-left py-1 w-1/2">Наименование</th>
                        <th className="text-center py-1 w-1/4">Кол-во</th>
                        <th className="text-right py-1 w-1/4">Цена</th>
                    </tr>
                </thead>
                <tbody>
                    {orderContext.orderItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-0 align-top">
                            <td className="py-2 pr-2">{item.title}</td>
                            <td className="py-2 text-center">{item.qty}</td>
                            <td className="py-2 text-right">{(item.price * item.qty).toLocaleString()} с.</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-b border-black border-dashed my-2"></div>

            {/* Totals */}
            <div className={`${textSize} space-y-1 mb-4`}>
                <div className="flex justify-between font-bold text-sm">
                    <span>ИТОГОВАЯ СУММА:</span>
                    <span>{orderContext.totalPrice.toLocaleString()} с.</span>
                </div>
                {config.showCashbackInfo && orderContext.usedCashback > 0 && (
                    <div className="flex justify-between text-gray-700">
                        <span>Списанный кэшбэк:</span>
                        <span>-{orderContext.usedCashback.toLocaleString()} с.</span>
                    </div>
                )}
                {config.showCashbackInfo && orderContext.earnedCashback > 0 && (
                    <div className="flex justify-between text-gray-700">
                        <span>Начисленный кэшбэк:</span>
                        <span>+{orderContext.earnedCashback.toLocaleString()} с.</span>
                    </div>
                )}
                <div className="flex justify-between pt-1">
                    <span>Тип оплаты:</span>
                    <span>{orderContext.paymentMethod}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="border-b border-black border-dashed my-2"></div>
            <div className="text-center mt-4">
                <p className={`font-bold ${textSize}`}>{config.footerText}</p>
                {config.showBarcode && orderContext.orderNumber && (
                    <div className="mt-3 flex flex-col items-center">
                        {/* CSS-based fake barcode or simple dashes for layout */}
                        <div className="h-10 w-4/5 bg-repeating-linear-gradient-to-r from-black to-transparent bg-[length:4px_100%] border-x-4 border-black">
                            <div className="w-full h-full flex items-center justify-around opacity-50">
                                <div className="w-1 h-full bg-black"></div>
                                <div className="w-3 h-full bg-black"></div>
                                <div className="w-2 h-full bg-transparent"></div>
                                <div className="w-1 h-full bg-black"></div>
                                <div className="w-4 h-full bg-black"></div>
                                <div className="w-1 h-full bg-transparent"></div>
                                <div className="w-2 h-full bg-black"></div>
                            </div>
                        </div>
                        <p className="text-[10px] mt-1 tracking-widest">{orderContext.orderNumber}</p>
                    </div>
                )}
            </div>

        </div>
    );
});

export default Receipt;
