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

export type SubmissionValidationQuestionnaire = {
    readonly short_labels: Readonly<Record<string, string>>;
    readonly questions: unknown;
};

const getExpectedSeriesLength = (questions: unknown): number | null => {
    if (typeof questions !== 'object' || questions === null) {
        return null;
    }
    const maybeSeries = (questions as { series?: unknown }).series;
    if (!Array.isArray(maybeSeries) || maybeSeries.length < 1) {
        return null;
    }
    const series0 = maybeSeries[0];
    if (!Array.isArray(series0)) {
        return null;
    }
    return series0.length;
};

export function validateLikertScoresRecord(
    questionnaire: SubmissionValidationQuestionnaire,
    scores: Readonly<Record<string, number>>
): string | null {
    const expected = Object.keys(questionnaire.short_labels)
        .map(k => Number(k))
        .filter(n => Number.isFinite(n));
    const expectedSet = new Set(expected);
    if (expected.length === 0) {
        return 'Questionnaire sans scores Likert.';
    }
    for (const k of expected) {
        const v = scores[String(k)];
        if (v === undefined) {
            return `Réponse manquante pour le score ${String(k)}.`;
        }
        if (!Number.isInteger(v) || v < 0 || v > 9) {
            return 'Les réponses Likert doivent être des entiers entre 0 et 9.';
        }
    }
    for (const key of Object.keys(scores)) {
        const n = Number(key);
        if (!Number.isFinite(n) || !expectedSet.has(n)) {
            return `Clé de score inconnue : ${key}.`;
        }
    }
    return null;
}

export function validateSubmissionSeries(
    questionnaire: SubmissionValidationQuestionnaire,
    series0: readonly number[],
    series1: readonly number[]
): string | null {
    const expected = getExpectedSeriesLength(questionnaire.questions);
    if (expected === null) {
        return 'Questionnaire invalide: structure des séries absente.';
    }
    if (series0.length !== expected || series1.length !== expected) {
        return `Attendu ${String(expected)} réponses par série.`;
    }
    for (const answers of [series0, series1] as const) {
        if (!answers.every(a => Number.isInteger(a) && a >= 0 && a <= 5)) {
            return 'Les réponses doivent être des entiers entre 0 et 5.';
        }
    }
    return null;
}

export function validateParticipantInfo(info: { name?: string; email?: string }, requireInfo: boolean): string | null {
    if (requireInfo && (!info.name || !info.email)) {
        return 'Nom et email requis.';
    }
    return null;
}
