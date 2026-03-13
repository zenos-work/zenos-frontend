import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from '../lib/api';


interface User{
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url: string;
}

interface AuthCtx {
    user: User | null;
    login: () => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthCtx>(null!);
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code && window.location.pathname === '/auth/google/callback') {
            api.post('/auth/google/callback', { code })
                .then((response) => {
                    sessionStorage.setItem('access_token', response.data.access_token);
                    setUser(response.data.user);
                    window.history.replaceState({}, document.title, '/'); // Clean URL

                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setTimeout(() => setLoading(false), 0);
        }
    }, []);

    const login = () => {
        console.log('Initiating login...');
        console.log('Redirecting to:', `${import.meta.env.VITE_API_BASE_URL}/auth/google/login`);
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/login`; // Redirect to backend for Google OAuth
    };

    const logout = () => {
        if(user) {
            api.post('/auth/logout', { user_id: user.id })
            sessionStorage.clear();
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
