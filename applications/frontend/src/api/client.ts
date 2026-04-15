import { userAdmin } from '@/lib/auth';
import axios from 'axios';

export const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Injecte le JWT sur chaque requête admin
apiClient.interceptors.request.use(config => {
    const token = userAdmin.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Redirige vers /admin/login si 401
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
            userAdmin.removeToken();
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);
