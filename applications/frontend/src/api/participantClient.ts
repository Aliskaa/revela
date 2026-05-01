import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/authStore';

/**
 * Client HTTP pour l'espace participant. G1 RGPD : auth via cookies httpOnly uniquement
 * (`aor_participant_access`, `aor_participant_refresh`). L'injection `Authorization: Bearer`
 * a été retirée. Sur 401, tente `POST /participant/auth/refresh` puis rejoue la requête ;
 * échec → clear store + redirect login.
 */
export const participantApiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let pendingParticipantRefresh: Promise<void> | null = null;

const performParticipantRefresh = async (): Promise<void> => {
    if (!pendingParticipantRefresh) {
        pendingParticipantRefresh = axios
            .post('/api/participant/auth/refresh', {}, { withCredentials: true })
            .then(() => undefined)
            .finally(() => {
                pendingParticipantRefresh = null;
            });
    }
    return pendingParticipantRefresh;
};

const redirectToLoginIfNeeded = () => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return;
    if (path.startsWith('/login') || path.startsWith('/forgot-password') || path.startsWith('/invite/')) return;
    window.location.href = '/login';
};

participantApiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        const status = error.response?.status;
        const isAuthCall =
            config?.url?.includes('/participant/auth/login') === true ||
            config?.url?.includes('/participant/auth/refresh') === true;

        if (status === 401 && config && !config._retried && !isAuthCall) {
            config._retried = true;
            try {
                await performParticipantRefresh();
                return participantApiClient(config);
            } catch {
                useAuthStore.getState().setParticipantMe(null);
                redirectToLoginIfNeeded();
                return Promise.reject(error);
            }
        }

        if (status === 401 && !window.location.pathname.startsWith('/admin')) {
            useAuthStore.getState().setParticipantMe(null);
            redirectToLoginIfNeeded();
        }
        return Promise.reject(error);
    }
);
