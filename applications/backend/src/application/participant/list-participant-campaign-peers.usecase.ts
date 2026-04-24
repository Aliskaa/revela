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

import { ParticipantQuestionnaireNotAllowedError } from '@src/domain/participant/participant-session.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    CampaignPeerChoiceItemDto,
    IParticipantsCampaignStateReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class ListParticipantCampaignPeersUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsInviteAssignmentsReaderPort & IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(participantId: number, campaignId: number): Promise<CampaignPeerChoiceItemDto[]> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (!assignments.some(assignment => assignment.campaignId !== null && assignment.campaignId === campaignId)) {
            throw new ParticipantQuestionnaireNotAllowedError('Cette campagne ne correspond pas à vos affectations.');
        }

        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign || campaign.status === 'archived') {
            throw new ParticipantQuestionnaireNotAllowedError();
        }

        const participation = await this.ports.participants.getCampaignParticipantInviteState(
            campaignId,
            participantId
        );
        if (!participation?.joinedAt) {
            throw new ParticipantQuestionnaireNotAllowedError(
                'Vous devez confirmer votre participation à la campagne.'
            );
        }

        return this.ports.participants.listJoinedCampaignPeerChoices(campaignId, participantId);
    }
}
