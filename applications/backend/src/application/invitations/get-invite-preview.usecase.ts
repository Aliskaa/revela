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

import { getQuestionnaireEntry } from '@aor/questionnaires';

import { InviteResourceNotFoundError, InviteTokenRequestError } from '@src/domain/invitations/invitations.errors';
import type { CampaignStatus, ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IParticipantsIdentityReaderPort, IParticipantsCampaignStateReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';

import type { InviteTokenValidationUseCase } from './invite-token-validation.usecase';

/** Resolves invitation token into preview data for the public invite page. */
export class GetInvitePreviewUseCase {
    public constructor(
        private readonly ports: {
            readonly tokenValidation: InviteTokenValidationUseCase;
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort;
            readonly companies: ICompaniesReadPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(token: string): Promise<{
        token: string;
        questionnaire_id: string;
        questionnaire_title: string;
        needs_activation: boolean;
        campaign_id: number | null;
        campaign_status: CampaignStatus | null;
        invitation_confirmed: boolean;
        needs_participation_confirmation: boolean;
        participant_id: number;
        participant: { name: string; email: string; organisation: string };
    }> {
        const validated = await this.ports.tokenValidation.validateTokenString(token);
        if ('error' in validated) {
            throw new InviteTokenRequestError(validated.error);
        }
        const { invitation } = validated;
        const participant = await this.ports.participants.findById(invitation.participantId);
        if (!participant) {
            throw new InviteResourceNotFoundError('Participant introuvable.');
        }
        const company =
            participant.companyId === null ? null : await this.ports.companies.findById(participant.companyId);
        const qMeta = getQuestionnaireEntry(invitation.questionnaireId);
        const campaignId = invitation.campaignId ?? null;
        let campaignStatus: CampaignStatus | null = null;
        let invitationConfirmed = true;
        let needsParticipationConfirmation = false;
        if (campaignId !== null) {
            const campaign = await this.ports.campaigns.findById(campaignId);
            campaignStatus = campaign?.status ?? null;
            const state = await this.ports.participants.getCampaignParticipantInviteState(campaignId, participant.id);
            invitationConfirmed = state?.joinedAt != null;
            needsParticipationConfirmation = !invitationConfirmed;
        }
        return {
            token,
            questionnaire_id: invitation.questionnaireId,
            questionnaire_title: qMeta?.title ?? '',
            needs_activation: participant.passwordHash === null,
            campaign_id: campaignId,
            campaign_status: campaignStatus,
            invitation_confirmed: invitationConfirmed,
            needs_participation_confirmation: needsParticipationConfirmation,
            participant_id: participant.id,
            participant: {
                name: `${participant.firstName} ${participant.lastName}`,
                email: participant.email,
                organisation: company?.name ?? '',
            },
        };
    }
}
