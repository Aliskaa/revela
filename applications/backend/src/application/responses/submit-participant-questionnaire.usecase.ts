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

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';
import { calculateScores } from '@aor/scoring';
import type { QuestionnaireId } from '@aor/types';
import { submitParticipantQuestionnaireBodySchema } from '@aor/types';

import {
    formatPeerRatingStoredName,
    parsePeerRatingTargetParticipantId,
} from '@aor/domain';
import { ResponsesQuestionnaireNotFoundError, ResponsesValidationError } from '@src/domain/responses/responses.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IParticipantsIdentityReaderPort, IParticipantsInviteAssignmentsReaderPort, IParticipantsCampaignStateReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type {
    IResponsesSubmissionReaderPort,
    IResponsesWriterPort,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { validateLikertScoresRecord, validateSubmissionSeries } from '@aor/domain';

export class SubmitParticipantQuestionnaireUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsInviteAssignmentsReaderPort & IParticipantsCampaignStateReaderPort;
            readonly companies: ICompaniesReadPort;
            readonly campaigns: ICampaignsReadPort;
            readonly responses: IResponsesWriterPort & IResponsesSubmissionReaderPort;
        }
    ) {}

    public async execute(
        participantId: number,
        qidParam: string,
        body: unknown,
        requestedCampaignId?: number
    ): Promise<{
        response_id: number;
        scores: Record<string, number>;
        qid: string;
    }> {
        const qid = qidParam.toUpperCase();
        const questionnaire = getQuestionnaireEntry(qid);
        if (!questionnaire || !isQuestionnaireUserFacing(qid)) {
            throw new ResponsesQuestionnaireNotFoundError();
        }

        const parsed = submitParticipantQuestionnaireBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new ResponsesValidationError('Corps JSON invalide.');
        }
        const payload = parsed.data;

        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new ResponsesValidationError('Participant introuvable.');
        }
        if (!participant.passwordHash) {
            throw new ResponsesValidationError('Compte non activé.');
        }

        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        if (assignments.length === 0) {
            throw new ResponsesValidationError('Aucune affectation campagne/questionnaire trouvée.');
        }
        const effectiveAssignment = assignments.find(assignment => {
            const qidMatches = assignment.questionnaireId.toUpperCase() === qid.toUpperCase();
            const campaignMatches = requestedCampaignId === undefined || assignment.campaignId === requestedCampaignId;
            return qidMatches && campaignMatches;
        });
        if (!effectiveAssignment) {
            throw new ResponsesValidationError('Ce questionnaire/campagne ne correspond pas à une affectation active.');
        }
        if (effectiveAssignment.campaignId === null || effectiveAssignment.campaignId === undefined) {
            throw new ResponsesValidationError('Aucune campagne active associee a cette affectation.');
        }
        const campaignId = effectiveAssignment.campaignId;
        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign || campaign.status !== 'active') {
            throw new ResponsesValidationError('La campagne n’est pas ouverte aux réponses pour le moment.');
        }
        const participation = await this.ports.participants.getCampaignParticipantInviteState(
            campaignId,
            participantId
        );
        if (!participation?.joinedAt) {
            throw new ResponsesValidationError(
                'Vous devez confirmer votre participation à la campagne avant de répondre.'
            );
        }

        const company =
            participant.companyId === null ? null : await this.ports.companies.findById(participant.companyId);
        const info = {
            name: `${participant.firstName} ${participant.lastName}`,
            email: participant.email,
            organisation: company?.name ?? '',
        };

        if ('kind' in payload && payload.kind === 'self_rating') {
            const existing = await this.ports.responses.listForSubjectQuestionnaireMatrix(
                participant.id,
                qid,
                campaignId
            );
            if (existing.some(r => r.submissionKind === 'self_rating')) {
                throw new ResponsesValidationError('Auto-evaluation deja soumise. Modification non autorisee.');
            }
            const errLikert = validateLikertScoresRecord(questionnaire, payload.scores);
            if (errLikert) {
                throw new ResponsesValidationError(errLikert);
            }
            const scoresRows = Object.entries(payload.scores).map(([scoreKey, value]) => ({
                scoreKey: Number(scoreKey),
                value,
            }));
            const record = await this.ports.responses.create({
                questionnaireId: qid,
                campaignId,
                submissionKind: 'self_rating',
                subjectParticipantId: participant.id,
                raterParticipantId: participant.id,
                participantId: participant.id,
                name: info.name,
                email: info.email,
                organisation: info.organisation,
                scores: scoresRows,
            });
            const scoresOut: Record<string, number> = {};
            for (const row of scoresRows) {
                scoresOut[String(row.scoreKey)] = row.value;
            }
            return { response_id: record.id, scores: scoresOut, qid };
        }

        if ('kind' in payload && payload.kind === 'peer_rating') {
            const existing = await this.ports.responses.listForSubjectQuestionnaireMatrix(
                participant.id,
                qid,
                campaignId
            );
            const peerLabel = payload.peer_label.trim();
            const ratedParticipantId = payload.rated_participant_id;

            if (ratedParticipantId !== undefined) {
                if (ratedParticipantId === participant.id) {
                    throw new ResponsesValidationError('Vous ne pouvez pas vous choisir comme pair.');
                }
                const allowedPeers = await this.ports.participants.listJoinedCampaignPeerChoices(
                    campaignId,
                    participant.id
                );
                if (!allowedPeers.some(p => p.participant_id === ratedParticipantId)) {
                    throw new ResponsesValidationError(
                        'Ce participant ne fait pas partie des pairs disponibles pour cette campagne.'
                    );
                }
            }

            const peerResponses = existing.filter(r => r.submissionKind === 'peer_rating');
            const isDuplicate = peerResponses.some(r => {
                if (ratedParticipantId !== undefined) {
                    return parsePeerRatingTargetParticipantId(r.name) === ratedParticipantId;
                }
                return parsePeerRatingTargetParticipantId(r.name) === null && r.name.trim() === peerLabel;
            });
            if (isDuplicate) {
                throw new ResponsesValidationError('Feedback pair deja soumis. Modification non autorisee.');
            }
            if (peerResponses.length >= 5) {
                throw new ResponsesValidationError(
                    'Le nombre maximum de feedbacks pairs (5) est atteint pour ce questionnaire.'
                );
            }

            const storedPeerName =
                ratedParticipantId !== undefined
                    ? formatPeerRatingStoredName(ratedParticipantId, peerLabel)
                    : peerLabel;

            const errLikert = validateLikertScoresRecord(questionnaire, payload.scores);
            if (errLikert) {
                throw new ResponsesValidationError(errLikert);
            }
            const scoresRows = Object.entries(payload.scores).map(([scoreKey, value]) => ({
                scoreKey: Number(scoreKey),
                value,
            }));
            const record = await this.ports.responses.create({
                questionnaireId: qid,
                campaignId,
                submissionKind: 'peer_rating',
                subjectParticipantId: participant.id,
                raterParticipantId: null,
                participantId: participant.id,
                name: storedPeerName,
                email: participant.email,
                organisation: info.organisation,
                scores: scoresRows,
            });
            const scoresOut: Record<string, number> = {};
            for (const row of scoresRows) {
                scoresOut[String(row.scoreKey)] = row.value;
            }
            return { response_id: record.id, scores: scoresOut, qid };
        }

        const { series0, series1 } = payload;
        const existing = await this.ports.responses.listForSubjectQuestionnaireMatrix(participant.id, qid, campaignId);
        if (existing.some(r => r.submissionKind === 'element_humain')) {
            throw new ResponsesValidationError('Test scientifique deja soumis. Modification non autorisee.');
        }
        const errSeries = validateSubmissionSeries(questionnaire, series0, series1);
        if (errSeries) {
            throw new ResponsesValidationError(errSeries);
        }

        const scoresMap = calculateScores(qid as QuestionnaireId, series0, series1);
        const scoresRows = Object.entries(scoresMap).map(([scoreKey, value]) => ({
            scoreKey: Number(scoreKey),
            value,
        }));

        const record = await this.ports.responses.create({
            questionnaireId: qid,
            campaignId,
            submissionKind: 'element_humain',
            subjectParticipantId: participant.id,
            raterParticipantId: participant.id,
            participantId: participant.id,
            name: info.name,
            email: info.email,
            organisation: info.organisation,
            scores: scoresRows,
        });

        const scoresOut: Record<string, number> = {};
        for (const [k, v] of Object.entries(scoresMap)) {
            scoresOut[k] = v;
        }

        return { response_id: record.id, scores: scoresOut, qid };
    }
}
