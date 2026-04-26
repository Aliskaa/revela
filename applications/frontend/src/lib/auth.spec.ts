import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    parseAdminJwtClaims,
    parseParticipantJwtParticipantId,
    userAdmin,
    userParticipant,
} from './auth';

/**
 * Crée un faux JWT (signature factice — non vérifiée côté frontend) pour les tests.
 * Format : `header.payload.signature`, payload encodé en base64url.
 */
const fakeJwt = (payload: Record<string, unknown>): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

describe('userAdmin', () => {
    test('roundtrip set / get / remove', () => {
        expect(userAdmin.getToken()).toBeNull();
        userAdmin.setToken('jwt-admin');
        expect(userAdmin.getToken()).toBe('jwt-admin');
        userAdmin.removeToken();
        expect(userAdmin.getToken()).toBeNull();
    });

    test('isAuthenticated retourne false sans token', () => {
        expect(userAdmin.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated retourne true pour un token non expiré', () => {
        const futureExp = Math.floor(Date.now() / 1000) + 3600;
        userAdmin.setToken(fakeJwt({ sub: 'admin', exp: futureExp }));
        expect(userAdmin.isAuthenticated()).toBe(true);
    });

    test('isAuthenticated retourne false pour un token expiré', () => {
        const pastExp = Math.floor(Date.now() / 1000) - 3600;
        userAdmin.setToken(fakeJwt({ sub: 'admin', exp: pastExp }));
        expect(userAdmin.isAuthenticated()).toBe(false);
    });

    test('isAuthenticated retourne false pour un token invalide', () => {
        userAdmin.setToken('not-a-jwt');
        expect(userAdmin.isAuthenticated()).toBe(false);
    });
});

describe('parseAdminJwtClaims', () => {
    test('retourne null sans token', () => {
        expect(parseAdminJwtClaims()).toBeNull();
    });

    test('extrait scope=super-admin par défaut', () => {
        userAdmin.setToken(fakeJwt({ sub: 'admin', role: 'admin' }));
        expect(parseAdminJwtClaims()).toEqual({ scope: 'super-admin' });
    });

    test('extrait scope=coach + coachId quand présents', () => {
        userAdmin.setToken(fakeJwt({ sub: 'jdoe', role: 'admin', scope: 'coach', coachId: 42 }));
        expect(parseAdminJwtClaims()).toEqual({ scope: 'coach', coachId: 42 });
    });

    test('coachId reste undefined si non numérique', () => {
        userAdmin.setToken(fakeJwt({ sub: 'jdoe', role: 'admin', scope: 'coach', coachId: 'abc' }));
        expect(parseAdminJwtClaims()).toEqual({ scope: 'coach', coachId: undefined });
    });

    test('retourne null pour un token corrompu', () => {
        userAdmin.setToken('corrupted');
        expect(parseAdminJwtClaims()).toBeNull();
    });
});

describe('userParticipant', () => {
    test('utilise une clé de stockage distincte de userAdmin', () => {
        userAdmin.setToken('jwt-admin');
        userParticipant.setToken('jwt-participant');
        expect(userAdmin.getToken()).toBe('jwt-admin');
        expect(userParticipant.getToken()).toBe('jwt-participant');
    });
});

describe('parseParticipantJwtParticipantId', () => {
    test('retourne null sans token', () => {
        expect(parseParticipantJwtParticipantId()).toBeNull();
    });

    test('extrait sub numérique', () => {
        userParticipant.setToken(fakeJwt({ sub: '42' }));
        expect(parseParticipantJwtParticipantId()).toBe(42);
    });

    test('retourne null si sub non numérique', () => {
        userParticipant.setToken(fakeJwt({ sub: 'not-a-number' }));
        expect(parseParticipantJwtParticipantId()).toBeNull();
    });

    test('retourne null si token corrompu', () => {
        userParticipant.setToken('not-a-jwt');
        expect(parseParticipantJwtParticipantId()).toBeNull();
    });
});
