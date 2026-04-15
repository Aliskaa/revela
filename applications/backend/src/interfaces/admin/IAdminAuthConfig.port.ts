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

export const ADMIN_AUTH_CONFIG_PORT_SYMBOL = Symbol('ADMIN_AUTH_CONFIG_PORT_SYMBOL');

export interface IAdminAuthConfigPort {
    readonly superAdminUsername: string;
    readonly superAdminPassword: string;
}
