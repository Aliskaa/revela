import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/authStore';

/**
 * Client HTTP pour l'espace admin (super-admin et coach). G1 RGPD : auth via cookies
 * httpOnly uniquement (`aor_admin_access`, `aor_admin_refresh`). `withCredentials: true`
 * envoie ces cookies à chaque requête. L'injection `Authorization: Bearer` a été retirée :
 * le frontend n'a plus accès au JWT.
 *
 * Sur 401, on tente une rotation via `POST /admin/auth/refresh` puis on rejoue la requête.
 * Si le refresh échoue → clear store + redirect login. Une seule promesse de refresh à la
 * fois (déduplication des appels concurrents).
 */
export const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let pendingAdminRefresh: Promise<void> | null = null;

const performAdminRefresh = async (): Promise<void> => {
    if (!pendingAdminRefresh) {
        pendingAdminRefresh = axios
            .post('/api/admin/auth/refresh', {}, { withCredentials: true })
            .then(() => undefined)
            .finally(() => {
                pendingAdminRefresh = null;
            });
    }
    return pendingAdminRefresh;
};

apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        const status = error.response?.status;
        const isAuthCall =
            config?.url?.includes('/admin/auth/login') === true ||
            config?.url?.includes('/admin/auth/refresh') === true;

        if (status === 401 && config && !config._retried && !isAuthCall) {
            config._retried = true;
            try {
                await performAdminRefresh();
                return apiClient(config);
            } catch {
                useAuthStore.getState().setAdminMe(null);
                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin/login';
                }
                return Promise.reject(error);
            }
        }

        if (status === 401 && window.location.pathname.startsWith('/admin')) {
            useAuthStore.getState().setAdminMe(null);
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);
