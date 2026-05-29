// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Échelle Likert des short labels (regard sur soi, feedback pairs). */
export const LIKERT_SHORT_LABEL = {
    min: 0,
    max: 9,
    rangeLabel: '0 à 9',
} as const;

/** Échelle du test Élément Humain (séries je suis / je veux). */
export const ELEMENT_HUMAIN_LIKERT = {
    min: 0,
    max: 5,
    rangeLabel: '0 à 5',
    endpointLabels: {
        min: 'Pas d’accord',
        max: 'D’accord',
    },
} as const;
