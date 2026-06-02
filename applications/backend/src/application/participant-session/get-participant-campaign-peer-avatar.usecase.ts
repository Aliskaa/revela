// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantAvatarNotFoundError } from '@src/domain/participant-session/participant-avatar.errors';
import { ParticipantQuestionnaireNotAllowedError } from '@src/domain/participant-session/participant-session.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class GetParticipantCampaignPeerAvatarUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsInviteAssignmentsReaderPort &
                IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(
        participantId: number,
        campaignId: number,
        peerParticipantId: number
    ): Promise<{ buffer: Buffer; mimeType: string }> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (!assignments.some(assignment => assignment.campaignId === campaignId)) {
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

        const peers = await this.ports.participants.listJoinedCampaignPeerChoices(campaignId, participantId);
        if (!peers.some(peer => peer.participant_id === peerParticipantId)) {
            throw new ParticipantQuestionnaireNotAllowedError('Ce pair ne fait pas partie de votre campagne.');
        }

        const stored = await this.ports.participants.findAvatar(peerParticipantId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
