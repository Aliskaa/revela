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

import type { QuestionnaireCatalogEntry } from '@aor/questionnaires';

import type { ResponseRecord } from '@src/interfaces/responses/IResponsesRepository.port';

export function scoresObject(record: ResponseRecord): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const score of record.scores) {
        scores[String(score.scoreKey)] = score.value;
    }
    return scores;
}

export function responseBaseJson(record: ResponseRecord) {
    return {
        id: record.id,
        questionnaire_id: record.questionnaireId,
        submission_kind: record.submissionKind,
        subject_participant_id: record.subjectParticipantId,
        rater_participant_id: record.raterParticipantId,
        rated_participant_id: record.ratedParticipantId,
        name: record.name,
        email: record.email,
        organisation: record.organisation ?? '',
        submitted_at: record.submittedAt?.toISOString() ?? null,
        scores: scoresObject(record),
    };
}

export function responseWithCatalogToJson(record: ResponseRecord, catalog: QuestionnaireCatalogEntry) {
    return {
        ...responseBaseJson(record),
        result_dims: catalog.result_dims,
        score_labels: catalog.score_labels,
        short_labels: catalog.short_labels,
    };
}
