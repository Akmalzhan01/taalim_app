import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBooks } from '../features/books/bookSlice';
import { Search, Printer } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import ImageWithFallback from '../components/ImageWithFallback';

const BarcodePrinter = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { books, isLoading } = useSelector((state: RootState) => state.books);
    const { settings } = useSelector((state: RootState) => state.settings);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooks, setSelectedBooks] = useState<Record<string, number>>({});

    useEffect(() => {
        dispatch(getBooks());
    }, [dispatch]);

    const filteredBooks = books.filter((book: any) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectBook = (bookId: string, qty: number) => {
        setSelectedBooks(prev => {
            const next = { ...prev };
            if (qty <= 0) {
                delete next[bookId];
            } else {
                next[bookId] = qty;
            }
            return next;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allSelected: Record<string, number> = {};
            filteredBooks.forEach((book: any) => {
                allSelected[book._id] = 1;
            });
            setSelectedBooks(allSelected);
        } else {
            setSelectedBooks({});
        }
    };

    const printableRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printableRef,
        documentTitle: 'Штрихкоды',
    });

    // Array of elements to print
    const printItems: any[] = [];
    Object.entries(selectedBooks).forEach(([bookId, qty]) => {
        const book = books.find((b: any) => b._id === bookId);
        if (book) {
            for (let i = 0; i < qty; i++) {
                printItems.push(book);
            }
        }
    });

    const printerSize = settings?.barcodePrinterSettings?.printerSize || 'A4';

    return (
        <div className="p-8 h-[calc(100vh-80px)] overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        Печать штрих-кодов
                    </h1>
                    <p className="text-slate-500 mt-1">Выберите товары и укажите количество наклеек</p>
                </div>
                <button
                    onClick={() => handlePrint()}
                    disabled={printItems.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                >
                    <Printer size={18} />
                    Печать ({printItems.length} шт)
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Поиск товара..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm mt-1 uppercase tracking-wider">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        onChange={handleSelectAll}
                                        checked={filteredBooks.length > 0 && Object.keys(selectedBooks).length === filteredBooks.length}
                                    />
                                </th>
                                <th className="p-4 font-semibold">Товар</th>
                                <th className="p-4 font-semibold">Цена</th>
                                <th className="p-4 font-semibold">Склад</th>
                                <th className="p-4 font-semibold w-48 text-center">Кол-во для печати</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Загрузка...</td>
                                </tr>
                            ) : filteredBooks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Ничего не найдено</td>
                                </tr>
                            ) : (
                                filteredBooks.map((book: any) => (
                                    <tr key={book._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={!!selectedBooks[book._id]}
                                                onChange={(e) => handleSelectBook(book._id, e.target.checked ? 1 : 0)}
                                            />
                                        </td>
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                                                <ImageWithFallback src={book.image} alt={book.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 line-clamp-1">{book.title}</div>
                                                <div className="text-xs text-slate-500">ID: {book._id}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">{book.price?.toLocaleString()} с.</td>
                                        <td className="p-4">
                                            {book.countInStock > 0 ? (
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold">{book.countInStock} шт</span>
                                            ) : (
                                                <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-lg text-xs font-bold">0 шт</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={selectedBooks[book._id] || 0}
                                                    onChange={(e) => handleSelectBook(book._id, Number(e.target.value))}
                                                    className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Printable Area */}
            <div className="hidden">
                <div ref={printableRef} className={`print-area p-8 bg-white ${printerSize === 'Thermal' ? 'thermal-print' : 'a4-print'}`}>
                    <style type="text/css" media="print">
                        {`
                        @page { 
                            size: ${printerSize === 'Thermal' ? '58mm auto' : 'A4'}; 
                            margin: 0; 
                        }
                        body { 
                            margin: ${printerSize === 'Thermal' ? '0' : '1cm'}; 
                            padding: ${printerSize === 'Thermal' ? '2mm' : '0'}; 
                            background-color: white !important;
                        }
                        .barcode-grid { 
                            display: ${printerSize === 'Thermal' ? 'flex' : 'grid'}; 
                            flex-direction: column;
                            grid-template-columns: ${printerSize === 'Thermal' ? '1fr' : 'repeat(3, 1fr)'}; 
                            gap: ${printerSize === 'Thermal' ? '10px' : '20px'}; 
                            row-gap: ${printerSize === 'Thermal' ? '15px' : '30px'};
                        }
                        .barcode-item { 
                            text-align: center; 
                            border: ${printerSize === 'Thermal' ? 'none' : '1px dashed #e2e8f0'}; 
                            padding: ${printerSize === 'Thermal' ? '5px' : '15px'}; 
                            page-break-inside: avoid; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            background: white;
                            width: ${printerSize === 'Thermal' ? '100%' : 'auto'};
                            margin-bottom: ${printerSize === 'Thermal' ? '5mm' : '0'};
                        }
                        `}
                    </style>
                    <h2 className={`text-2xl font-bold mb-6 text-center ${printerSize === 'Thermal' ? 'hidden' : 'print:block hidden'}`}>Штрих-коды товаров</h2>
                    <div className="barcode-grid">
                        {printItems.map((book: any, index: number) => (
                            <div key={`${book._id}-${index}`} className="barcode-item">
                                <div className={`font-bold truncate w-full mb-1 px-2 print:text-black ${printerSize === 'Thermal' ? 'text-[10px]' : 'text-sm'}`}>{book.title}</div>
                                <Barcode
                                    value={book._id.slice(-12).toUpperCase()}
                                    format="CODE128"
                                    width={printerSize === 'Thermal' ? 1.2 : 1.8}
                                    height={printerSize === 'Thermal' ? 40 : 50}
                                    fontSize={printerSize === 'Thermal' ? 10 : 14}
                                    displayValue={true}
                                    background="transparent"
                                    margin={0}
                                />
                                <div className={`font-black mt-1 print:text-black leading-none ${printerSize === 'Thermal' ? 'text-sm' : 'text-lg mt-2'}`}>{book.price.toLocaleString()} с.</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodePrinter;
