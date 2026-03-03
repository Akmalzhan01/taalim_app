import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBanners, createBanner, deleteBanner, reset } from '../features/banners/bannerSlice';
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
import type { AppDispatch, RootState } from '../app/store';
import ImageWithFallback from '../components/ImageWithFallback';

const Banners = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { banners, isLoading, isError, message } = useSelector(
        (state: RootState) => state.banners
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        color: '#3B82F6',
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isError) {
            alert(message);
        }
        dispatch(getBanners());
        return () => { dispatch(reset()); };
    }, [isError, message, dispatch]);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            dispatch(deleteBanner(id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createBanner(formData));
        setIsModalOpen(false);
        setFormData({
            title: '',
            subtitle: '',
            image: '',
            color: '#3B82F6',
        });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Загрузка...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Баннеры</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление баннерами в мобильном приложении</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all font-medium text-sm"
                >
                    <Plus size={18} /> Добавить баннер
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner: any) => (
                    <div key={banner._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
                        <div className="h-40 bg-slate-100 relative">
                            <ImageWithFallback
                                src={banner.image}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                <span className="text-xs font-bold text-white/80 mb-1">{banner.subtitle}</span>
                                <h3 className="text-lg font-bold text-white leading-tight">{banner.title}</h3>
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: banner.color }}></div>
                                {banner.color}
                            </div>
                            <button
                                onClick={() => handleDelete(banner._id)}
                                className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {banners.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        <ImageIcon size={48} className="mb-4 opacity-50" />
                        <p>Нет активных баннеров</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Новый баннер</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Заголовок</label>
                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium" required placeholder="Напр: Скидки 50%" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Подзаголовок</label>
                                <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium" required placeholder="Напр: Только сегодня" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Цвет (HEX)</label>
                                <div className="flex gap-2">
                                    <input type="color" name="color" value={formData.color} onChange={handleInputChange} className="h-11 w-11 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                                    <input type="text" name="color" value={formData.color} onChange={handleInputChange} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Изображение</label>
                                <div className="flex gap-2">
                                    <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="URL..." />
                                    <div className="relative">
                                        <input type="file" accept="image/*" onChange={uploadFileHandler} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading} />
                                        <button type="button" className="bg-slate-100 px-4 py-3 rounded-xl text-slate-600 text-sm font-medium border border-slate-200 hover:bg-slate-200">{uploading ? '...' : 'Загр.'}</button>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all text-sm mt-4">Создать баннер</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banners;
