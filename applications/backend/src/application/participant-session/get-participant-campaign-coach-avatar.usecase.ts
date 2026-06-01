// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantQuestionnaireNotAllowedError } from '@src/domain/participant-session/participant-session.errors';
import { ParticipantAvatarNotFoundError } from '@src/domain/participant-session/participant-avatar.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import type { IParticipantsInviteAssignmentsReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';

export class GetParticipantCampaignCoachAvatarUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsInviteAssignmentsReaderPort;
            readonly campaigns: ICampaignsReadPort;
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute(
        participantId: number,
        campaignId: number
    ): Promise<{ buffer: Buffer; mimeType: string }> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (!assignments.some(assignment => assignment.campaignId === campaignId)) {
            throw new ParticipantQuestionnaireNotAllowedError('Cette campagne ne correspond pas à vos affectations.');
        }

        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign || campaign.status === 'archived') {
            throw new ParticipantQuestionnaireNotAllowedError();
        }

        const coachId = campaign.coachId;
        if (coachId === null || coachId === undefined) {
            throw new ParticipantAvatarNotFoundError();
        }

        const stored = await this.ports.coaches.findAvatar(coachId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
