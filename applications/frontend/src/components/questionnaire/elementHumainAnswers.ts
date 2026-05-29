// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Map des réponses du test Élément Humain, indexée par clé `"series-question"`. */
export type AnswersMap = Record<string, number | null>;

/**
 * Construit une clé `"series-question"` pour stocker une réponse dans la map.
 * Choisi pour rester sérialisable et permettre une hydratation directe depuis
 * un brouillon (`series0[i]` → clé `"0-i"`).
 */
export const answerKey = (seriesIndex: number, questionIndex: number) =>
    `${String(seriesIndex)}-${String(questionIndex)}`;
