import axios from 'axios';

import { type AdminAuthMe, type ParticipantAuthMe, useAuthStore } from '@/stores/authStore';

/**
 * Façades d'auth côté frontend (G1 RGPD — cookies httpOnly).
 *
 * Les JWTs vivent désormais exclusivement dans les cookies httpOnly posés par le backend
 * (`aor_admin_access`, `aor_admin_refresh`, `aor_participant_access`, `aor_participant_refresh`)
 * — JS ne peut plus les lire (mitigation XSS). Les claims utiles (scope, coachId,
 * participantId) sont conservés dans le store Zustand `useAuthStore`, alimenté :
 *  - au boot via `GET /<scope>/auth/me` (cf. `bootstrapAuth` dans `main.tsx`) ;
 *  - après login (les hooks `useAdminLogin` / `useParticipantLogin` set le store) ;
 *  - effacé après logout, 401 non rattrapable, ou expiration de session.
 *
 * `userAdmin` / `userParticipant` exposent une API stable pour le reste du code (les routes
 * `beforeLoad` notamment) : `isAuthenticated()` synchrone, `removeToken()` qui pousse aussi
 * un appel `/auth/logout` au backend pour révoquer la famille de refresh tokens.
 */

type AuthFacade = {
    /** Lecture sync — vrai si le store contient un `me` non-null pour ce scope. */
    isAuthenticated(): boolean;
    /**
     * Logout : appelle `POST /<scope>/auth/logout` (best-effort) qui clear les cookies
     * httpOnly côté navigateur et révoque la famille de refresh tokens côté DB, puis
     * efface le store local.
     */
    removeToken(): void;
};

const buildFacade = (
    scope: 'admin' | 'participant',
    select: () => AdminAuthMe | ParticipantAuthMe | null
): AuthFacade => {
    const logoutUrl = scope === 'admin' ? '/api/admin/auth/logout' : '/api/participant/auth/logout';
    return {
        isAuthenticated() {
            return select() !== null;
        },
        removeToken() {
            // Best-effort : si l'appel échoue (réseau, 401), on continue — l'utilisateur
            // est déjà déconnecté localement.
            void axios.post(logoutUrl, {}, { withCredentials: true }).catch(() => {});
            if (scope === 'admin') {
                useAuthStore.getState().setAdminMe(null);
            } else {
                useAuthStore.getState().setParticipantMe(null);
            }
        },
    };
};

export const userAdmin: AuthFacade = buildFacade('admin', () => useAuthStore.getState().adminMe);
export const userParticipant: AuthFacade = buildFacade('participant', () => useAuthStore.getState().participantMe);

export type AdminJwtClaims = {
    scope: 'super-admin' | 'coach';
    coachId?: number;
};

/**
 * Claims admin courants lus depuis le store. Synchrone — utilisable dans les `beforeLoad`
 * de TanStack Router. Renvoie `null` si non authentifié comme admin.
 */
export const parseAdminJwtClaims = (): AdminJwtClaims | null => {
    const me = useAuthStore.getState().adminMe;
    if (!me) return null;
    return {
        scope: me.scope,
        coachId: me.coachId === null ? undefined : me.coachId,
    };
};

/** ID numérique du participant courant, ou `null` si non authentifié. */
export const parseParticipantJwtParticipantId = (): number | null => {
    return useAuthStore.getState().participantMe?.participantId ?? null;
};
