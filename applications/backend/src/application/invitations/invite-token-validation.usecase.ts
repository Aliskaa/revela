// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Invitation } from '@src/domain/invitations';
import type { IInvitationsReadPort } from '@src/interfaces/invitations/IInvitationsRepository.port';

export class InviteTokenValidationUseCase {
    public constructor(private readonly ports: { readonly invitations: IInvitationsReadPort }) {}

    public async validateTokenString(tokenStr: string): Promise<{ invitation: Invitation } | { error: string }> {
        const invitation = await this.ports.invitations.findByToken(tokenStr);
        if (!invitation) {
            return { error: 'Lien invalide.' };
        }
        const check = invitation.checkUsable(new Date());
        if (!check.usable) {
            return { error: check.reason };
        }
        return { invitation };
    }
}
