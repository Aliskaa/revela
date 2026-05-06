// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantQuestionnaireNotAllowedError } from '@src/domain/participant-session/participant-session.errors';
import { ResponsesValidationError } from '@src/domain/responses/responses.errors';
import type {
    IParticipantsCampaignParticipationWriterPort,
    IParticipantsCampaignStateReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export type ConfirmPeerFeedbackResult = {
    /** Toujours `true` une fois l'opération réussie. */
    confirmed: true;
    /** `true` si l'étape était déjà `completed` avant l'appel (idempotence). */
    wasAlreadyCompleted: boolean;
    /** `true` si l'étape `element_humain` vient d'être débloquée par cette confirmation. */
    unlockedElementHumain: boolean;
};

/**
 * Confirmation explicite par le participant qu'il a terminé l'étape feedback pairs (cf. P12/P13).
 * Règle métier :
 *  - le participant doit être invité à la campagne (sinon 401-style erreur)
 *  - il doit avoir saisi au moins **1** feedback pair (refusé sinon)
 *  - idempotent : si l'étape est déjà `completed` (par ex. auto-complete au 5e feedback), on
 *    retourne `wasAlreadyCompleted: true` sans modification
 *  - sinon : passe `peer_feedback_status` à `completed` + débloque `element_humain` si les
 *    pré-requis sont remplis (`self_rating` terminé OU campagne `allow_test_without_manual_inputs`)
 */
export class ConfirmPeerFeedbackUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsCampaignStateReaderPort & IParticipantsCampaignParticipationWriterPort;
        }
    ) {}

    public async execute(participantId: number, campaignId: number): Promise<ConfirmPeerFeedbackResult> {
        const inviteState = await this.ports.participants.getCampaignParticipantInviteState(campaignId, participantId);
        if (!inviteState) {
            throw new ParticipantQuestionnaireNotAllowedError("Vous n'êtes pas invité à cette campagne.");
        }

        const peerCount = await this.ports.participants.countPeerRatingsForCampaignSubject(campaignId, participantId);
        if (peerCount < 1) {
            throw new ResponsesValidationError(
                'Vous devez avoir saisi au moins un feedback pair avant de pouvoir confirmer la fin de cette étape.'
            );
        }

        const result = await this.ports.participants.markPeerFeedbackCompletedForCampaignSubject(
            campaignId,
            participantId
        );
        return {
            confirmed: true,
            wasAlreadyCompleted: result.wasAlreadyCompleted,
            unlockedElementHumain: result.unlockedElementHumain,
        };
    }
}
