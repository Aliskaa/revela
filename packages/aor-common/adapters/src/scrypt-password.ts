/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PREFIX = 'scrypt1';
const KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 } as const;

export function hashPassword(plainPassword: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(plainPassword, salt, KEYLEN, SCRYPT_OPTS);
    return `${PREFIX}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(plainPassword: string, stored: string): boolean {
    if (!stored.startsWith(`${PREFIX}$`)) {
        return false;
    }
    const parts = stored.split('$');
    if (parts.length !== 3) {
        return false;
    }
    const [, saltB64, hashB64] = parts;
    if (!saltB64 || !hashB64) {
        return false;
    }
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(hashB64, 'base64url');
    const hash = scryptSync(plainPassword, salt, expected.length, SCRYPT_OPTS);
    return hash.length === expected.length && timingSafeEqual(hash, expected);
}

/**
 * Vérifie contre un hash `scrypt1$...`, ou en clair pour les entrées historiques
 * (ex. coaches créés avant l'introduction du hachage).
 */
export function verifyPasswordOrPlaintextLegacy(plainPassword: string, stored: string): boolean {
    if (verifyPassword(plainPassword, stored)) {
        return true;
    }
    if (stored.startsWith(`${PREFIX}$`)) {
        return false;
    }
    return stored === plainPassword;
}
