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

export const PASSWORD_VERIFIER_PORT_SYMBOL = Symbol('PASSWORD_VERIFIER_PORT_SYMBOL');

export interface IPasswordVerifierPort {
    verify(plainPassword: string, stored: string): boolean;
    verifyOrPlaintextLegacy(plainPassword: string, stored: string): boolean;
}
