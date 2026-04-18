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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type QuestionnaireDimension = {
    readonly name: string;
    readonly icon: string;
};

export type QuestionnaireCatalogEntry = {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly dimensions: readonly QuestionnaireDimension[];
    readonly questions: unknown;
    readonly score_labels: Readonly<Record<string, string>>;
    readonly short_labels: Readonly<Record<string, string>>;
    readonly result_dims: unknown;
    readonly score_groups: Readonly<Record<string, readonly number[]>>;
};

const catalogDir = dirname(fileURLToPath(import.meta.url));

export const QUESTIONNAIRE_CATALOG: Readonly<Record<string, QuestionnaireCatalogEntry>> = JSON.parse(
    readFileSync(join(catalogDir, 'catalog.json'), 'utf8')
) as Record<string, QuestionnaireCatalogEntry>;

export const QUESTIONNAIRE_IDS = Object.freeze(Object.keys(QUESTIONNAIRE_CATALOG));

export function isQuestionnaireUserFacing(qid: string): boolean {
    return Boolean(QUESTIONNAIRE_CATALOG[qid.toUpperCase()]);
}

export function getQuestionnaireEntry(qid: string): QuestionnaireCatalogEntry | undefined {
    return QUESTIONNAIRE_CATALOG[qid.toUpperCase()];
}

export function listQuestionnairesSummary(): Array<{
    id: string;
    title: string;
    description: string;
    dimensions: readonly QuestionnaireDimension[];
}> {
    return Object.entries(QUESTIONNAIRE_CATALOG).map(([id, questionnaire]) => ({
        id,
        title: questionnaire.title,
        description: questionnaire.description,
        dimensions: questionnaire.dimensions,
    }));
}

/** Public app and invite flows: same shape as {@link listQuestionnairesSummary}, filtered to user-facing questionnaires. */
export function listQuestionnairesSummaryForUserApp(): Array<{
    id: string;
    title: string;
    description: string;
    dimensions: readonly QuestionnaireDimension[];
}> {
    return listQuestionnairesSummary().filter(q => isQuestionnaireUserFacing(q.id));
}
