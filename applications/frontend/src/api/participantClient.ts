import { userParticipant } from '@/lib/auth';
import axios from 'axios';

/**
 * HTTP client for participant-facing API routes. Uses a separate Bearer token from admin {@link auth}.
 */
export const participantApiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

participantApiClient.interceptors.request.use(config => {
    const token = userParticipant.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

participantApiClient.interceptors.response.use(
    response => response,
    error => {
        const path = window.location.pathname;
        if (error.response?.status === 401 && !path.startsWith('/admin')) {
            userParticipant.removeToken();
            if (!path.startsWith('/login') && !path.startsWith('/forgot-password')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
