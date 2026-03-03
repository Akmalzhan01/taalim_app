import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2, X, Save, Search, Eye, Heart, Link as LinkIcon, Upload, Loader } from 'lucide-react';
import { getBlogs, createBlog, updateBlog, deleteBlog, reset } from '../features/blogs/blogSlice';
import type { AppDispatch, RootState } from '../app/store';
import axios from 'axios';

const Blogs = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { blogs, isLoading, isSuccess, isError, message } = useSelector(
        (state: RootState) => state.blogs
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [link, setLink] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        dispatch(getBlogs());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            alert(message);
            dispatch(reset());
        }
        if (isSuccess && (isModalOpen || isEditMode)) {
            closeModal();
            dispatch(reset());
        }
    }, [isError, isSuccess, message, dispatch]);

    const openModal = () => {
        setIsModalOpen(true);
        setIsEditMode(false);
        setTitle('');
        setDescription('');
        setImage('');
        setLink('');
        setUploading(false);
    };

    const openEditModal = (blog: any) => {
        setIsModalOpen(true);
        setIsEditMode(true);
        setCurrentId(blog._id);
        setTitle(blog.title);
        setDescription(blog.description);
        setImage(blog.image);
        setLink(blog.link || '');
        setUploading(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentId('');
        setTitle('');
        setDescription('');
        setImage('');
        setLink('');
        setUploading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);
            setUploading(true);

            try {
                const config = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                };

                const { data } = await axios.post('http://localhost:5000/api/upload', formData, config);
                setImage(data.url);
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
        if (isEditMode) {
            dispatch(updateBlog({ id: currentId, blogData: { title, description, image, link } }));
        } else {
            dispatch(createBlog({ title, description, image, link }));
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот блог?')) {
            dispatch(deleteBlog(id));
        }
    };

    const filteredBlogs = blogs.filter((blog: any) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Новости и Блоги</h2>
                    <p className="text-slate-500 text-sm mt-1">Управление контентом блога</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm font-medium"
                >
                    <Plus size={18} />
                    Добавить новость
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Поиск по заголовку..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog: any) => (
                    <div key={blog._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                        <div className="relative h-48 w-full overflow-hidden">
                            <img
                                src={blog.image}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button
                                    onClick={() => openEditModal(blog)}
                                    className="p-2 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-indigo-600 rounded-lg shadow-sm transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(blog._id)}
                                    className="p-2 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-rose-600 rounded-lg shadow-sm transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                                    {blog.title}
                                </h3>
                                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                                    {blog.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Eye size={14} />
                                        <span>{blog.views || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Heart size={14} />
                                        <span>{blog.likes || 0}</span>
                                    </div>
                                </div>
                                {blog.link && (
                                    <a
                                        href={blog.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-700 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <LinkIcon size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBlogs.length === 0 && !isLoading && (
                <div className="text-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                    Новости не найдены
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">
                                {isEditMode ? 'Редактировать новость' : 'Новая новость'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Заголовок
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Введите заголовок новости"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Описание
                                </label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    placeholder="Введите текст новости..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Изображение
                                </label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            placeholder="URL изображения или загрузите файл"
                                            className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <label className="cursor-pointer p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-colors block">
                                                <Upload size={18} />
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {uploading && (
                                    <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1.5">
                                        <Loader size={12} className="animate-spin" />
                                        Загрузка изображения...
                                    </div>
                                )}
                                {image && !uploading && (
                                    <div className="mt-3 relative h-40 w-full rounded-xl overflow-hidden border border-slate-200">
                                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Внешняя ссылка (опционально)
                                </label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || uploading}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        'Сохранение...'
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Сохранить
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blogs;
