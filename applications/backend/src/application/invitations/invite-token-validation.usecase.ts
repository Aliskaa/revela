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

import type {
    IInvitationsReadPort,
    InvitationRecord,
} from '@src/interfaces/invitations/IInvitationsRepository.port';

export class InviteTokenValidationUseCase {
    public constructor(private readonly ports: { readonly invitations: IInvitationsReadPort }) {}

    public async validateTokenString(tokenStr: string): Promise<{ invitation: InvitationRecord } | { error: string }> {
        const invitation = await this.ports.invitations.findByToken(tokenStr);
        if (!invitation) {
            return { error: 'Lien invalide.' };
        }
        if (!invitation.isActive) {
            return { error: 'Ce lien a été désactivé.' };
        }
        if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
            return { error: 'Ce lien a expiré.' };
        }
        if (invitation.usedAt) {
            return { error: 'Ce lien a déjà été utilisé.' };
        }
        return { invitation };
    }
}
