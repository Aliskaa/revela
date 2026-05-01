// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { CookieOptions, Response } from 'express';

/**
 * Cookies httpOnly d'authentification (G1 RGPD).
 *
 * - `accessCookie`  : porte le JWT court (~15 min). Exposé à toutes les routes API (path=/).
 * - `refreshCookie` : porte le refresh token long (30 j). Restreint au path de refresh
 *                     (`/api/<scope>/auth/refresh`) pour minimiser l'exposition.
 *
 * En production (`NODE_ENV=production`), les cookies sont marqués `Secure` (HTTPS only).
 * `SameSite=Strict` est utilisé car frontend + backend partagent le même domaine en prod.
 */

export type AuthScope = 'admin' | 'participant';

export type AuthCookieNames = {
    access: string;
    refresh: string;
};

export const ADMIN_COOKIE_NAMES: AuthCookieNames = {
    access: 'aor_admin_access',
    refresh: 'aor_admin_refresh',
};

export const PARTICIPANT_COOKIE_NAMES: AuthCookieNames = {
    access: 'aor_participant_access',
    refresh: 'aor_participant_refresh',
};

const cookieNamesFor = (scope: AuthScope): AuthCookieNames =>
    scope === 'admin' ? ADMIN_COOKIE_NAMES : PARTICIPANT_COOKIE_NAMES;

const refreshPathFor = (scope: AuthScope): string => (scope === 'admin' ? '/api/admin/auth' : '/api/participant/auth');

/** TTL access token (15 minutes) — synchronisé avec `signOptions.expiresIn` côté JwtModule. */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

const baseOptions = (): CookieOptions => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
});

export type SetAuthCookiesInput = {
    scope: AuthScope;
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
};

/**
 * Pose les deux cookies d'auth sur la `Response` Express. À appeler dans le controller
 * après login ou rotation.
 */
export function setAuthCookies(res: Response, input: SetAuthCookiesInput): void {
    const names = cookieNamesFor(input.scope);
    res.cookie(names.access, input.accessToken, {
        ...baseOptions(),
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_MS,
    });
    res.cookie(names.refresh, input.refreshToken, {
        ...baseOptions(),
        path: refreshPathFor(input.scope),
        expires: input.refreshExpiresAt,
    });
}

/**
 * Efface les deux cookies d'auth (logout). Doit utiliser exactement le même `path`
 * que celui utilisé pour les poser, sinon le navigateur ne les supprime pas.
 */
export function clearAuthCookies(res: Response, scope: AuthScope): void {
    const names = cookieNamesFor(scope);
    res.clearCookie(names.access, { ...baseOptions(), path: '/' });
    res.clearCookie(names.refresh, { ...baseOptions(), path: refreshPathFor(scope) });
}
