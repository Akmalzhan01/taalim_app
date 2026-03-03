import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import type { RootState, AppDispatch } from '../app/store';
import { Lock, Mail } from 'lucide-react';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.auth
    );

    useEffect(() => {
        if (isError) {
            alert(message); // Simple alert for now, can be improved
        }

        if (isSuccess || user) {
            navigate('/dashboard');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const userData = {
            email,
            password,
        };

        dispatch(login(userData));
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="mx-auto w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-slate-200">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Вход в систему</h2>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Введите учетные данные для доступа</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider ml-1" htmlFor="email">
                            Email адрес
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-400 group-focus-within:text-slate-900">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider ml-1" htmlFor="password">
                            Пароль
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-400 group-focus-within:text-slate-900">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-300/50 active:scale-[0.98] transition-all duration-200 text-sm tracking-wide mt-2"
                    >
                        ВОЙТИ В КАБИНЕТ
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-300 text-xs font-medium">Безопасный доступ • Taalim Admin</p>
                </div>
            </div>
        </div>
    );
}

export default Login;
