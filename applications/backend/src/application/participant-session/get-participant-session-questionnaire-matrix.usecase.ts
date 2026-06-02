// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import type { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import {
    ParticipantAssignedQuestionnaireMissingError,
    ParticipantQuestionnaireNotAllowedError,
} from '@src/domain/participant-session/participant-session.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IParticipantsInviteAssignmentsReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';

export class GetParticipantSessionQuestionnaireMatrixUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsInviteAssignmentsReaderPort;
            readonly campaigns: ICampaignsReadPort;
            readonly getMatrix: GetParticipantQuestionnaireMatrixUseCase;
        }
    ) {}

    /**
     * Le `qid` n'est plus un paramètre d'entrée (ADR-010 R2) : il est **dérivé de la campagne**
     * via l'assignation du participant. Une campagne ne portant qu'un seul questionnaire, le
     * `campaignId` (segment de route) suffit à sélectionner l'assignation, donc le questionnaire.
     */
    public async execute(
        participantId: number,
        campaignId: number,
        peerColumnPerspective: 'given' | 'received' = 'given'
    ): Promise<ParticipantQuestionnaireMatrix> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (assignments.length === 0) {
            throw new ParticipantAssignedQuestionnaireMissingError();
        }

        const match = assignments.find(assignment => assignment.campaignId === campaignId);
        if (!match) {
            throw new ParticipantQuestionnaireNotAllowedError();
        }
        const matchedCampaignId = match.campaignId;
        if (matchedCampaignId === null || matchedCampaignId === undefined) {
            throw new ParticipantQuestionnaireNotAllowedError();
        }

        const campaign = await this.ports.campaigns.findById(matchedCampaignId);
        if (!campaign || campaign.status === 'archived') {
            throw new ParticipantQuestionnaireNotAllowedError();
        }

        return this.ports.getMatrix.execute({
            participantId,
            qid: match.questionnaireId.toUpperCase(),
            campaignId: matchedCampaignId,
            peerColumnPerspective,
            anonymizeReceivedPeerLabels: peerColumnPerspective === 'received',
        });
    }
}
