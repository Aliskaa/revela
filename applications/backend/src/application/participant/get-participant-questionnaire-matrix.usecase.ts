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

import { getQuestionnaireEntry } from '@aor/questionnaires';

import {
    displayPeerRatingStoredLabel,
    parsePeerRatingTargetParticipantId,
} from '@aor/domain';
import { AdminInvalidQuestionnaireError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IParticipantsIdentityReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type {
    IResponsesSubmissionReaderPort,
    ResponseRecord,
    SubmissionKind,
} from '@src/interfaces/responses/IResponsesRepository.port';

export type MatrixPeerColumnDto = {
    response_id: number;
    label: string;
    rater_participant_id: number | null;
    rated_participant_id: number | null;
};

export type MatrixRowDto = {
    score_key: number;
    label: string;
    self: number | null;
    peers: (number | null)[];
    scientific: number | null;
};

export type ParticipantQuestionnaireMatrixDto = {
    subject_id: number;
    questionnaire_id: string;
    questionnaire_title: string;
    likert_max: number;
    scientific_value_max: number;
    peer_columns: MatrixPeerColumnDto[];
    self_response_id: number | null;
    scientific_response_id: number | null;
    rows: MatrixRowDto[];
    result_dims: unknown;
    short_labels: Readonly<Record<string, string>>;
};

const LIKERT_MAX = 9;

const scoresToMap = (record: ResponseRecord | null): Map<number, number> => {
    const map = new Map<number, number>();
    if (!record) {
        return map;
    }
    for (const s of record.scores) {
        map.set(s.scoreKey, s.value);
    }
    return map;
};

const latestBySubmittedAt = (records: ResponseRecord[]): ResponseRecord | null => {
    if (records.length === 0) {
        return null;
    }
    return records.reduce((best, cur) => {
        const tb = best.submittedAt?.getTime() ?? 0;
        const tc = cur.submittedAt?.getTime() ?? 0;
        return tc >= tb ? cur : best;
    });
};

const byKind = (records: ResponseRecord[], kind: SubmissionKind): ResponseRecord[] =>
    records.filter(r => r.submissionKind === kind);

export class GetParticipantQuestionnaireMatrixUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort;
            readonly responses: IResponsesSubmissionReaderPort;
        }
    ) {}

    public async execute(params: {
        participantId: number;
        qid: string;
        campaignId?: number;
    }): Promise<ParticipantQuestionnaireMatrixDto> {
        const participant = await this.ports.participants.findById(params.participantId);
        if (!participant) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }
        const qid = params.qid;
        const catalog = getQuestionnaireEntry(qid);
        if (!catalog) {
            throw new AdminInvalidQuestionnaireError('Questionnaire invalide.');
        }

        const responses = await this.ports.responses.listForSubjectQuestionnaireMatrix(
            params.participantId,
            qid,
            params.campaignId
        );

        const selfRecord = latestBySubmittedAt(byKind(responses, 'self_rating'));
        const scientificRecord = latestBySubmittedAt(byKind(responses, 'element_humain'));

        const peerCandidates = byKind(responses, 'peer_rating');
        peerCandidates.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
        const peerRecords = peerCandidates.slice(0, 5).reverse();

        const peer_columns: MatrixPeerColumnDto[] = peerRecords.map(r => {
            const rawName = r.name.trim() || `Pair #${String(r.id)}`;
            return {
                response_id: r.id,
                label: displayPeerRatingStoredLabel(rawName),
                rater_participant_id: r.raterParticipantId,
                rated_participant_id: r.ratedParticipantId ?? parsePeerRatingTargetParticipantId(rawName),
            };
        });

        const scoreKeys = Object.keys(catalog.short_labels)
            .map(k => Number(k))
            .filter(n => Number.isFinite(n))
            .sort((a, b) => a - b);

        const selfMap = scoresToMap(selfRecord);
        const scientificMap = scoresToMap(scientificRecord);
        const peerMaps = peerRecords.map(r => scoresToMap(r));

        const rows: MatrixRowDto[] = scoreKeys.map(score_key => ({
            score_key,
            label: catalog.short_labels[String(score_key)] ?? String(score_key),
            self: selfMap.get(score_key) ?? null,
            peers: peerMaps.map(m => m.get(score_key) ?? null),
            scientific: scientificMap.get(score_key) ?? null,
        }));

        const scientificValues = rows.map(r => r.scientific).filter((v): v is number => v !== null);
        const scientific_value_max =
            scientificValues.length > 0 ? Math.max(LIKERT_MAX, ...scientificValues) : LIKERT_MAX;

        return {
            subject_id: participant.id,
            questionnaire_id: catalog.id,
            questionnaire_title: catalog.title,
            likert_max: LIKERT_MAX,
            scientific_value_max,
            peer_columns,
            self_response_id: selfRecord?.id ?? null,
            scientific_response_id: scientificRecord?.id ?? null,
            rows,
            result_dims: catalog.result_dims,
            short_labels: catalog.short_labels,
        };
    }
}
