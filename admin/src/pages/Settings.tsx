import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSettings, updateSettings } from '../features/settings/settingSlice';
import type { AppDispatch, RootState } from '../app/store';
import { Settings as SettingsIcon, Save, Printer, Type, Image as ImageIcon, LayoutDashboard, Sliders } from 'lucide-react';

const Settings = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { settings, isLoading } = useSelector((state: RootState) => state.settings);

    const [activeTab, setActiveTab] = useState('pos');

    const [formSettings, setFormSettings] = useState({
        receiptSettings: {
            printerSize: '80mm',
            headerText: 'Taalim Kitob Olami',
            footerText: 'Спасибо за покупку!',
            showLogo: true,
            showCashbackInfo: true,
            showBarcode: true,
        },
        barcodePrinterSettings: {
            printerSize: 'A4'
        }
    });

    useEffect(() => {
        dispatch(getSettings());
    }, [dispatch]);

    useEffect(() => {
        if (settings) {
            setFormSettings({
                receiptSettings: settings.receiptSettings ? { ...settings.receiptSettings } : { ...formSettings.receiptSettings },
                barcodePrinterSettings: settings.barcodePrinterSettings ? { ...settings.barcodePrinterSettings } : { ...formSettings.barcodePrinterSettings }
            });
        }
    }, [settings]);

    const handleSave = () => {
        dispatch(updateSettings(formSettings));
        alert('Настройки успешно сохранены!');
    };

    if (isLoading && !settings) return <div className="p-8 text-center text-slate-500">Загрузка...</div>;

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-6 p-6">
            {/* Inner Sidebar */}
            <div className="w-64 shrink-0 flex flex-col gap-2">
                <div className="mb-4">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <SettingsIcon size={28} className="text-indigo-600" />
                        Настройки
                    </h1>
                </div>

                <nav className="flex flex-col gap-1">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'general'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        <Sliders size={20} className={activeTab === 'general' ? 'text-indigo-600' : 'text-slate-400'} />
                        Общие
                    </button>
                    <button
                        onClick={() => setActiveTab('pos')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pos'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-white hover:shadow-sm'
                            }`}
                    >
                        <Printer size={20} className={activeTab === 'pos' ? 'text-indigo-600' : 'text-slate-400'} />
                        Касса и Чеки
                    </button>
                </nav>
            </div>

            {/* Main Settings Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {/* Header Navbar */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {activeTab === 'pos' ? 'Настройки Кассы (POS)' : 'Общие настройки системы'}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            {activeTab === 'pos' ? 'Управление параметрами печати чеков.' : 'Основные параметры платформы.'}
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
                    >
                        <Save size={18} />
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
                    {activeTab === 'pos' && (
                        <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Size & Layout */}
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Бумага и Дизайн</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Размер принтера</label>
                                        <select
                                            value={formSettings.receiptSettings.printerSize}
                                            onChange={(e) => setFormSettings({ ...formSettings, receiptSettings: { ...formSettings.receiptSettings, printerSize: e.target.value } })}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-medium shadow-sm"
                                        >
                                            <option value="80mm">80мм (Большой термопринтер)</option>
                                            <option value="58mm">58мм (Малый термопринтер)</option>
                                            <option value="A4">A4 (Обычный принтер)</option>
                                        </select>
                                    </div>

                                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <ImageIcon size={20} className="text-slate-400" />
                                            <span className="text-sm font-bold text-slate-700">Показывать логотип?</span>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formSettings.receiptSettings.showLogo}
                                                onChange={(e) => setFormSettings({ ...formSettings, receiptSettings: { ...formSettings.receiptSettings, showLogo: e.target.checked } })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <SettingsIcon size={20} className="text-slate-400" />
                                            <span className="text-sm font-bold text-slate-700">Показывать кэшбэк?</span>
                                        </div>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formSettings.receiptSettings.showCashbackInfo}
                                                onChange={(e) => setFormSettings({ ...formSettings, receiptSettings: { ...formSettings.receiptSettings, showCashbackInfo: e.target.checked } })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </div>
                                    </label>
                                </div>

                                {/* Texts */}
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Тексты на чеке</h3>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Заголовок (Header)</label>
                                        <Type size={18} className="absolute right-3 top-10 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formSettings.receiptSettings.headerText}
                                            onChange={(e) => setFormSettings({ ...formSettings, receiptSettings: { ...formSettings.receiptSettings, headerText: e.target.value } })}
                                            className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-medium shadow-sm"
                                            placeholder="Название магазина"
                                        />
                                    </div>

                                    <div className="relative">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Подвал (Footer)</label>
                                        <textarea
                                            value={formSettings.receiptSettings.footerText}
                                            onChange={(e) => setFormSettings({ ...formSettings, receiptSettings: { ...formSettings.receiptSettings, footerText: e.target.value } })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-medium h-32 resize-none shadow-sm"
                                            placeholder="Спасибо за покупку, ждем вас снова!"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            <div className="space-y-5">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Настройки печати Штрих-кодов</h3>
                                <div className="max-w-md">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Размер принтера штрих-кодов</label>
                                    <select
                                        value={formSettings.barcodePrinterSettings.printerSize}
                                        onChange={(e) => setFormSettings({ ...formSettings, barcodePrinterSettings: { ...formSettings.barcodePrinterSettings, printerSize: e.target.value } })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-medium shadow-sm"
                                    >
                                        <option value="A4">A4 (Обычный принтер)</option>
                                        <option value="Thermal">Термопринтер (Лента)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="max-w-2xl animate-in fade-in duration-300 text-center py-20">
                            <LayoutDashboard size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">Общие настройки</h3>
                            <p className="text-slate-500 mt-2">Здесь скоро появятся другие глобальные параметры системы.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
