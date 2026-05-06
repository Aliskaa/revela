// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    ParticipantAssignedQuestionnaireMissingError,
    ParticipantQuestionnaireNotAllowedError,
} from '@src/domain/participant-session/participant-session.errors';
import type {
    IParticipantsInviteAssignmentsReaderPort,
    IParticipantsTransparencyScorePort,
    ParticipantTransparencyScoreSnapshot,
} from '@src/interfaces/participants/IParticipantsRepository.port';

/**
 * Lecture côté participant authentifié : vérifie que la campagne fait bien partie de ses
 * affectations (sinon erreur 401-équivalent), puis retourne le snapshot transparence.
 * Tant que le coach/admin n'a pas cliqué « Lancer le calcul », retourne `null`.
 */
export class GetOwnParticipantTransparencyScoreUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsInviteAssignmentsReaderPort;
            readonly transparency: IParticipantsTransparencyScorePort;
        }
    ) {}

    public async execute(
        participantId: number,
        campaignId: number
    ): Promise<ParticipantTransparencyScoreSnapshot | null> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (assignments.length === 0) {
            throw new ParticipantAssignedQuestionnaireMissingError();
        }
        const match = assignments.find(a => a.campaignId === campaignId);
        if (!match) {
            throw new ParticipantQuestionnaireNotAllowedError();
        }
        return this.ports.transparency.findTransparencyScoreSnapshot(campaignId, participantId);
    }
}
