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

    public async execute(
        participantId: number,
        qid?: string,
        campaignId?: number
    ): Promise<ParticipantQuestionnaireMatrix> {
        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (assignments.length === 0) {
            throw new ParticipantAssignedQuestionnaireMissingError();
        }

        const match = assignments.find(assignment => {
            if (assignment.campaignId === null || assignment.campaignId === undefined) {
                return false;
            }
            const qidMatches = qid === undefined || assignment.questionnaireId.toUpperCase() === qid;
            const campaignMatches = campaignId === undefined || assignment.campaignId === campaignId;
            return qidMatches && campaignMatches;
        });
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
        });
    }
}
