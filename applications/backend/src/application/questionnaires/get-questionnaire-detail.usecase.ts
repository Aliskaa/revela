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

import { type QuestionnaireCatalogEntry, getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';

import { QuestionnaireNotFoundError } from '@src/domain/questionnaires/questionnaires.errors';

export type QuestionnaireCatalogDetailResult = Pick<
    QuestionnaireCatalogEntry,
    'id' | 'title' | 'description' | 'questions' | 'score_labels' | 'short_labels' | 'result_dims'
>;

export class GetQuestionnaireDetailUseCase {
    public execute(qidParam: string): QuestionnaireCatalogDetailResult {
        const questionnaire = getQuestionnaireEntry(qidParam);
        if (!questionnaire || !isQuestionnaireUserFacing(questionnaire.id)) {
            throw new QuestionnaireNotFoundError();
        }
        return {
            id: questionnaire.id,
            title: questionnaire.title,
            description: questionnaire.description,
            questions: questionnaire.questions,
            score_labels: questionnaire.score_labels,
            short_labels: questionnaire.short_labels,
            result_dims: questionnaire.result_dims,
        };
    }
}
