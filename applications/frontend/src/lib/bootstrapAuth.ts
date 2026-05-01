import axios from 'axios';

import { type AdminAuthMe, type ParticipantAuthMe, useAuthStore } from '@/stores/authStore';

/**
 * Hydrate le store d'auth au démarrage de l'app en interrogeant `/<scope>/auth/me` pour
 * chaque scope. Les requêtes envoient `withCredentials: true` pour que les cookies
 * httpOnly d'auth soient inclus si présents (sinon on reçoit 401 silencieux et le store
 * reste vide pour ce scope).
 *
 * Appelé une seule fois avant le mount du `RouterProvider` dans `main.tsx`. Quand cette
 * fonction résout, les `beforeLoad` de TanStack Router peuvent lire le store de manière
 * synchrone via `userAdmin.isAuthenticated()` / `parseAdminJwtClaims()`.
 *
 * Les deux fetchs sont en parallèle ; un échec sur l'un n'annule pas l'autre. La fonction
 * ne lève jamais — elle marque simplement `bootstrapped = true` à la fin.
 */
export async function bootstrapAuth(): Promise<void> {
    const fetchAdminMe = axios
        .get<{ scope: 'super-admin' | 'coach'; coach_id: number | null; username: string }>('/api/admin/auth/me', {
            withCredentials: true,
        })
        .then(r => r.data)
        .catch(() => null);

    const fetchParticipantMe = axios
        .get<{ participant_id: number }>('/api/participant/auth/me', { withCredentials: true })
        .then(r => r.data)
        .catch(() => null);

    const [admin, participant] = await Promise.all([fetchAdminMe, fetchParticipantMe]);

    const setAdminMe = useAuthStore.getState().setAdminMe;
    const setParticipantMe = useAuthStore.getState().setParticipantMe;
    const setBootstrapped = useAuthStore.getState().setBootstrapped;

    if (admin) {
        const adminMe: AdminAuthMe = {
            scope: admin.scope,
            coachId: admin.coach_id,
            username: admin.username,
        };
        setAdminMe(adminMe);
    }
    if (participant) {
        const participantMe: ParticipantAuthMe = { participantId: participant.participant_id };
        setParticipantMe(participantMe);
    }
    setBootstrapped();
}
