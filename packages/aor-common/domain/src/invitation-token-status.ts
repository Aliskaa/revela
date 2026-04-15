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

/** Statut d'invitation pour l'interface d'administration (règle métier). */
export function invitationTokenAdminStatus(params: {
    readonly isActive: boolean;
    readonly usedAt: Date | null | undefined;
    readonly expiresAt: Date | null | undefined;
    /** Participation campagne confirmée (`joined_at`) alors que le jeton n'est pas encore consommé. */
    readonly participationConfirmed?: boolean;
}): string {
    if (!params.isActive) {
        return 'inactive';
    }
    if (params.usedAt) {
        return 'used';
    }
    if (params.expiresAt && params.expiresAt.getTime() < Date.now()) {
        return 'expired';
    }
    if (params.participationConfirmed) {
        return 'confirmed';
    }
    return 'pending';
}
