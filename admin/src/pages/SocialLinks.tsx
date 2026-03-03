import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getSocialLinks, createSocialLink, deleteSocialLink, reset } from '../features/socialLinks/socialLinkSlice';
import { Plus, Trash2, X, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';

const SocialLinks = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { socialLinks, isLoading, isError, message } = useSelector(
        (state: RootState) => state.socialLinks
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        platform: 'Other',
        url: '',
        icon: 'link-outline',
        isActive: true
    });

    const platforms = ['Instagram', 'Facebook', 'Telegram', 'Youtube', 'Twitter', 'LinkedIn', 'Website', 'Other'];
    const iconMap: { [key: string]: string } = {
        'Instagram': 'logo-instagram',
        'Facebook': 'logo-facebook',
        'Telegram': 'paper-plane-outline', // Ionicons uses paper-plane for telegram often or logo-telegram if available, user requested consistent icons
        'Youtube': 'logo-youtube',
        'Twitter': 'logo-twitter',
        'LinkedIn': 'logo-linkedin',
        'Website': 'globe-outline',
        'Other': 'link-outline'
    };

    useEffect(() => {
        if (isError) {
            alert(message);
        }
        dispatch(getSocialLinks());
        return () => { dispatch(reset()); };
    }, [isError, message, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this link?')) {
            dispatch(deleteSocialLink(id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'platform' && iconMap[value]) {
                newData.icon = iconMap[value];
            }
            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createSocialLink(formData));
        setIsModalOpen(false);
        setFormData({
            platform: 'Other',
            url: '',
            icon: 'link-outline',
            isActive: true
        });
    };

    const getIconComponent = () => {
        // Just for visual representation in Admin, we can use lucide icons mapped roughly or generic
        // In mobile we will use Ionicons names stored in DB
        return <LinkIcon size={24} className="text-slate-500" />;
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Загрузка...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Социальные сети</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление ссылками в профиле приложения</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm"
                >
                    <Plus size={18} /> Добавить ссылку
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {socialLinks.map((link: any) => (
                    <div key={link._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                {getIconComponent()}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{link.platform}</h3>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                    {link.url.length > 30 ? link.url.substring(0, 30) + '...' : link.url}
                                    <ExternalLink size={10} />
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(link._id)}
                            className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {socialLinks.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        <LinkIcon size={48} className="mb-4 opacity-50" />
                        <p>Нет активных ссылок</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Новая ссылка</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Платформа</label>
                                <select name="platform" value={formData.platform} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium">
                                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">URL адрес</label>
                                <input type="url" name="url" value={formData.url} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium" required placeholder="https://..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Иконка (Ionicons name)</label>
                                <input type="text" name="icon" value={formData.icon} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium" required />
                                <p className="text-[10px] text-slate-400 mt-1 ml-1">Автоматически выставляется при выборе платформы, можно изменить вручную.</p>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all text-sm mt-4">Добавить</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialLinks;
