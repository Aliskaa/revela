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

import type { IPasswordHasherPort, IPasswordVerifierPort } from '@aor/ports';

import { hashPassword, verifyPassword, verifyPasswordOrPlaintextLegacy } from './scrypt-password';

export class ScryptPasswordAdapter implements IPasswordHasherPort, IPasswordVerifierPort {
    public hash(plainPassword: string): string {
        return hashPassword(plainPassword);
    }

    public verify(plainPassword: string, stored: string): boolean {
        return verifyPassword(plainPassword, stored);
    }

    public verifyOrPlaintextLegacy(plainPassword: string, stored: string): boolean {
        return verifyPasswordOrPlaintextLegacy(plainPassword, stored);
    }
}
