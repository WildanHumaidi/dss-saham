import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp } from 'lucide-react';

const AuthContext = createContext({});
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('dss_user');
            return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(localStorage.getItem('dss_token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                localStorage.setItem('dss_token', token);
                if (!user) {
                    try {
                        const res = await axios.get(`${API_BASE}/api/user`);
                        setUser(res.data);
                        localStorage.setItem('dss_user', JSON.stringify(res.data));
                    } catch {
                        // BUG FIX #3: Saat token expired/invalid, state token harus
                        // di-null-kan agar effect ini tidak loop. Kode asli sudah
                        // benar di sini, tapi perlu dipastikan tidak meninggalkan
                        // Authorization header lama.
                        delete axios.defaults.headers.common['Authorization'];
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('dss_token');
                        localStorage.removeItem('dss_user');
                    }
                }
            } else {
                delete axios.defaults.headers.common['Authorization'];
                localStorage.removeItem('dss_token');
                localStorage.removeItem('dss_user');
                setUser(null);
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/api/login`, { email, password });
        // BUG FIX #4: Setelah login, set Authorization header segera agar
        // request berikutnya langsung authenticated tanpa menunggu effect.
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('dss_token', res.data.token);
        localStorage.setItem('dss_user', JSON.stringify(res.data.user));
    };

    const logout = async () => {
        try {
            await axios.post(`${API_BASE}/api/logout`);
        } catch {
            // Abaikan error logout dari server — tetap lanjut clear state lokal
        } finally {
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
            localStorage.removeItem('dss_token');
            localStorage.removeItem('dss_user');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                isAdmin: user?.role === 'admin',
            }}
        >
            {loading ? (
                <div
                    className="flex h-screen w-screen items-center justify-center flex-col gap-4"
                    style={{ background: 'linear-gradient(160deg, #061a0f 0%, #0a2718 100%)' }}
                >
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                        style={{
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            boxShadow: '0 4px 20px rgb(16 185 129 / .3)',
                        }}
                    >
                        <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="w-5 h-5 border-2 border-emerald-800 border-t-emerald-400 rounded-full"
                            style={{ animation: 'spin 700ms linear infinite' }}
                        />
                        <span className="text-sm font-semibold text-emerald-400/70 tracking-wide font-mono">
                            Memuat sesi...
                        </span>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);