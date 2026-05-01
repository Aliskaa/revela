import { create } from 'zustand';

/**
 * Source de vérité unique pour les claims d'auth côté frontend, depuis la migration G1
 * vers les cookies httpOnly. Les JWTs ne sont plus accessibles depuis JS (httpOnly), donc
 * on conserve les claims utiles (scope admin, ids) dans un store Zustand alimenté :
 *  - au boot de l'app via `GET /<scope>/auth/me` (cf. `bootstrapAuth` dans `main.tsx`) ;
 *  - après chaque login (les hooks `useAdminLogin` / `useParticipantLogin` set le store) ;
 *  - effacé sur logout, sur 401 non rattrapable, ou sur expiration de session.
 *
 * Les `beforeLoad` de TanStack Router lisent ce store de manière synchrone via
 * `useAuthStore.getState()` — pas de race condition tant que `bootstrapAuth` a résolu.
 */

export type AdminAuthMe = {
    scope: 'super-admin' | 'coach';
    coachId: number | null;
    username: string;
};

export type ParticipantAuthMe = {
    participantId: number;
};

type AuthStore = {
    adminMe: AdminAuthMe | null;
    participantMe: ParticipantAuthMe | null;
    /** `true` après le premier appel à `bootstrapAuth` (succès ou échec — peu importe). */
    bootstrapped: boolean;
    setAdminMe: (me: AdminAuthMe | null) => void;
    setParticipantMe: (me: ParticipantAuthMe | null) => void;
    setBootstrapped: () => void;
    clearAll: () => void;
};

export const useAuthStore = create<AuthStore>(set => ({
    adminMe: null,
    participantMe: null,
    bootstrapped: false,
    setAdminMe: me => set({ adminMe: me }),
    setParticipantMe: me => set({ participantMe: me }),
    setBootstrapped: () => set({ bootstrapped: true }),
    clearAll: () => set({ adminMe: null, participantMe: null }),
}));
