// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry } from '@aor/questionnaires';
import { calculateScores } from '@aor/scoring';
import type { QuestionnaireId } from '@aor/types';
import { submitInviteQuestionnaireBodySchema } from '@aor/types';

import { validateParticipantInfo, validateSubmissionSeries } from '@aor/domain';
import {
    InviteResourceNotFoundError,
    InviteSubmissionValidationError,
    InviteTokenRequestError,
} from '@src/domain/invitations/invitations.errors';
import { Response } from '@src/domain/responses';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesWriterPort } from '@src/interfaces/responses/IResponsesRepository.port';

import type { InviteTokenValidationUseCase } from './invite-token-validation.usecase';

/** Persists a response for an invitation and marks the token used in the same DB transaction. */
export class SubmitInviteQuestionnaireUseCase {
    public constructor(
        private readonly ports: {
            readonly tokenValidation: InviteTokenValidationUseCase;
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort;
            readonly companies: ICompaniesReadPort;
            readonly campaigns: ICampaignsReadPort;
            readonly responses: IResponsesWriterPort;
        }
    ) {}

    public async execute(
        token: string,
        body: unknown
    ): Promise<{
        response_id: number;
        scores: Record<string, number>;
        qid: string;
    }> {
        const validated = await this.ports.tokenValidation.validateTokenString(token);
        if ('error' in validated) {
            throw new InviteTokenRequestError(validated.error);
        }
        const { invitation } = validated;
        if (invitation.campaignId !== null && invitation.campaignId !== undefined) {
            const campaign = await this.ports.campaigns.findById(invitation.campaignId);
            if (!campaign || campaign.status !== 'active') {
                throw new InviteTokenRequestError('La campagne n’est pas encore ouverte aux réponses.');
            }
            const participation = await this.ports.participants.getCampaignParticipantInviteState(
                invitation.campaignId,
                invitation.participantId
            );
            if (!participation?.joinedAt) {
                throw new InviteTokenRequestError(
                    'Vous devez confirmer votre participation avant de répondre au questionnaire.'
                );
            }
        }
        const qid = invitation.questionnaireId;
        const questionnaire = getQuestionnaireEntry(qid);
        if (!questionnaire) {
            throw new InviteResourceNotFoundError('Questionnaire introuvable.');
        }

        const parsed = submitInviteQuestionnaireBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new InviteSubmissionValidationError('Corps JSON invalide.');
        }
        const { series0, series1 } = parsed.data;

        const participant = await this.ports.participants.findById(invitation.participantId);
        if (!participant) {
            throw new InviteResourceNotFoundError('Participant introuvable.');
        }
        const company =
            participant.companyId === null ? null : await this.ports.companies.findById(participant.companyId);
        const info = {
            name: `${participant.firstName} ${participant.lastName}`,
            email: participant.email,
            organisation: company?.name ?? '',
        };

        const errInfo = validateParticipantInfo(info, false);
        if (errInfo) {
            throw new InviteSubmissionValidationError(errInfo);
        }
        const errSeries = validateSubmissionSeries(questionnaire, series0, series1);
        if (errSeries) {
            throw new InviteSubmissionValidationError(errSeries);
        }

        const scoresMap = calculateScores(qid as QuestionnaireId, series0, series1);
        const scoresRows = Object.entries(scoresMap).map(([scoreKey, value]) => ({
            scoreKey: Number(scoreKey),
            value,
        }));

        const record = await this.ports.responses.create(
            Response.create({
                questionnaireId: qid,
                campaignId: invitation.campaignId ?? undefined,
                submissionKind: 'element_humain',
                subjectParticipantId: participant.id,
                raterParticipantId: participant.id,
                participantId: participant.id,
                inviteTokenId: invitation.id,
                name: info.name,
                email: info.email,
                organisation: info.organisation,
                scores: scoresRows,
            }),
            { markInviteTokenUsedId: invitation.id }
        );

        const scoresOut: Record<string, number> = {};
        for (const [k, v] of Object.entries(scoresMap)) {
            scoresOut[k] = v;
        }

        return { response_id: record.id, scores: scoresOut, qid };
    }
}
