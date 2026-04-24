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

import { invitationTokenAdminStatus } from '@aor/domain';
import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IInviteUrlConfigPort } from '@src/interfaces/admin/IInviteUrlConfig.port';
import type { IInvitationsReadPort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class ListParticipantInvitationTokensUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsInviteAssignmentsReaderPort;
            readonly invitations: IInvitationsReadPort;
            readonly inviteUrlConfig: IInviteUrlConfigPort;
        }
    ) {}

    public async execute(participantId: number): Promise<
        Array<{
            id: number;
            token: string;
            campaign_id: number | null;
            questionnaire_id: string;
            status: string;
            created_at: string | undefined;
            expires_at: string | null;
            used_at: string | null;
            invite_url: string;
        }>
    > {
        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }
        const tokens = await this.ports.invitations.findByParticipantId(participantId);
        const joinedCampaignIds =
            await this.ports.participants.listCampaignIdsWithConfirmedParticipation(participantId);
        const joinedCampaignIdSet = new Set(joinedCampaignIds);
        return tokens.map(t => ({
            id: t.id,
            token: t.token,
            campaign_id: t.campaignId,
            questionnaire_id: t.questionnaireId,
            status: invitationTokenAdminStatus({
                isActive: t.isActive,
                usedAt: t.usedAt,
                expiresAt: t.expiresAt,
                participationConfirmed: t.campaignId != null && joinedCampaignIdSet.has(t.campaignId),
            }),
            created_at: t.createdAt?.toISOString(),
            expires_at: t.expiresAt?.toISOString() ?? null,
            used_at: t.usedAt?.toISOString() ?? null,
            invite_url: `${this.ports.inviteUrlConfig.frontendBaseUrl}/invite/${t.token}`,
        }));
    }
}
