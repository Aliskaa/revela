// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantQuestionnaireNotAllowedError } from '@src/domain/participant-session/participant-session.errors';
import type {
    IParticipantsCampaignParticipationWriterPort,
    IParticipantsCampaignStateReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

/** Enregistre la confirmation explicite d'un participant authentifié pour une campagne où il a été invité. */
export class ConfirmCampaignParticipationUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsCampaignParticipationWriterPort & IParticipantsCampaignStateReaderPort;
        }
    ) {}

    public async execute(participantId: number, campaignId: number): Promise<{ invitation_confirmed: boolean }> {
        const state = await this.ports.participants.getCampaignParticipantInviteState(campaignId, participantId);
        if (!state) {
            throw new ParticipantQuestionnaireNotAllowedError("Vous n'êtes pas invité à cette campagne.");
        }
        if (state.joinedAt === null) {
            await this.ports.participants.confirmCampaignParticipantParticipation(campaignId, participantId);
        }
        return { invitation_confirmed: true };
    }
}
