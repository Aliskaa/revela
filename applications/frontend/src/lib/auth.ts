const ADMIN_TOKEN_KEY = 'aor_admin_token';
const PARTICIPANT_TOKEN_KEY = 'aor_participant_token';

function createJwtLocalStorageAuth(storageKey: string) {
    return {
        getToken(): string | null {
            return localStorage.getItem(storageKey);
        },

        setToken(token: string): void {
            localStorage.setItem(storageKey, token);
        },

        removeToken(): void {
            localStorage.removeItem(storageKey);
        },

        isAuthenticated(): boolean {
            const token = localStorage.getItem(storageKey);
            if (!token) {
                return false;
            }
            try {
                const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
                return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
            } catch {
                return false;
            }
        },
    };
}

/** Back-office JWT in `localStorage` (Axios admin client). */
export const userAdmin = createJwtLocalStorageAuth(ADMIN_TOKEN_KEY);

export type AdminJwtClaims = {
    scope: 'super-admin' | 'coach';
    coachId?: number;
};

export const parseAdminJwtClaims = (): AdminJwtClaims | null => {
    const token = userAdmin.getToken();
    if (!token) {
        return null;
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1])) as { scope?: string; coachId?: number };
        if (payload.scope === 'coach') {
            return {
                scope: 'coach',
                coachId: typeof payload.coachId === 'number' ? payload.coachId : undefined,
            };
        }
        return { scope: 'super-admin' };
    } catch {
        return null;
    }
};

/** Participant JWT in `localStorage` (Axios participant client). */
export const userParticipant = createJwtLocalStorageAuth(PARTICIPANT_TOKEN_KEY);

/** `sub` du JWT participant (identifiant numérique), ou `null` si absent ou invalide. */
export const parseParticipantJwtParticipantId = (): number | null => {
    const token = userParticipant.getToken();
    if (!token) {
        return null;
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
        const id = Number.parseInt(payload.sub ?? '', 10);
        return Number.isFinite(id) ? id : null;
    } catch {
        return null;
    }
};
