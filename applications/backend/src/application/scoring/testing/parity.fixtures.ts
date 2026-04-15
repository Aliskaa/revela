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

import type { QuestionnaireId } from '@aor/types';

/** Regression fixture extracted from Python parity baseline. */
export type ParityFixture = {
    id: string;
    questionnaireId: QuestionnaireId;
    series0: number[];
    series1: number[];
    expected: Record<number, number>;
};

const full = (value: number): number[] => Array.from({ length: 54 }, () => value);

export const PARITY_FIXTURES: ParityFixture[] = [
    {
        id: 'B-all3',
        questionnaireId: 'B',
        series0: full(3),
        series1: full(3),
        expected: {
            11: 7,
            12: 7,
            13: 8,
            14: 8,
            21: 9,
            22: 9,
            23: 9,
            24: 9,
            31: 1,
            32: 1,
            33: 5,
            34: 5,
        },
    },
    {
        id: 'B-seed42',
        questionnaireId: 'B',
        series0: [
            5, 0, 0, 5, 2, 1, 1, 1, 5, 0, 5, 5, 4, 0, 4, 3, 0, 0, 0, 1, 1, 4, 4, 0, 4, 1, 5, 5, 5, 4, 3, 1, 3, 4, 2, 0,
            1, 5, 3, 2, 2, 1, 1, 2, 0, 0, 3, 0, 2, 2, 4, 2, 0, 5,
        ],
        series1: [
            3, 4, 0, 3, 0, 4, 2, 5, 4, 2, 4, 1, 5, 0, 0, 5, 1, 2, 0, 1, 0, 3, 2, 3, 5, 2, 1, 2, 2, 1, 5, 2, 5, 5, 5, 0,
            4, 5, 1, 4, 5, 1, 1, 3, 3, 2, 5, 5, 4, 1, 5, 2, 0, 1,
        ],
        expected: {
            11: 5,
            12: 7,
            13: 6,
            14: 6,
            21: 7,
            22: 5,
            23: 5,
            24: 7,
            31: 4,
            32: 5,
            33: 3,
            34: 3,
        },
    },
    {
        id: 'F-all3',
        questionnaireId: 'F',
        series0: full(3),
        series1: full(3),
        expected: {
            41: 2,
            42: 2,
            43: 5,
            44: 5,
            51: 6,
            52: 6,
            53: 1,
            54: 1,
            61: 5,
            62: 5,
            63: 6,
            64: 6,
        },
    },
    {
        id: 'F-seed42',
        questionnaireId: 'F',
        series0: [
            0, 2, 3, 2, 0, 1, 4, 5, 2, 1, 5, 3, 3, 5, 3, 1, 2, 1, 1, 5, 4, 4, 2, 5, 4, 3, 4, 3, 2, 1, 1, 4, 3, 0, 0, 0,
            1, 5, 1, 5, 3, 4, 0, 3, 3, 4, 3, 4, 2, 4, 0, 5, 5, 0,
        ],
        series1: [
            5, 4, 2, 5, 2, 0, 2, 3, 1, 3, 0, 5, 5, 2, 4, 1, 4, 0, 5, 2, 5, 4, 4, 1, 1, 2, 1, 4, 4, 0, 4, 2, 3, 0, 0, 2,
            2, 1, 0, 1, 4, 0, 0, 5, 3, 0, 4, 1, 1, 5, 3, 4, 1, 2,
        ],
        expected: {
            41: 3,
            42: 1,
            43: 5,
            44: 7,
            51: 4,
            52: 7,
            53: 3,
            54: 2,
            61: 3,
            62: 2,
            63: 3,
            64: 2,
        },
    },
    {
        id: 'S-all3',
        questionnaireId: 'S',
        series0: full(3),
        series1: full(3),
        expected: {
            15: 1,
            16: 1,
            25: 4,
            26: 4,
            35: 6,
            36: 6,
            45: 4,
            46: 4,
            55: 4,
            56: 4,
            65: 4,
            66: 4,
        },
    },
    {
        id: 'S-seed42',
        questionnaireId: 'S',
        series0: [
            4, 4, 3, 1, 4, 5, 5, 1, 5, 2, 3, 5, 5, 2, 3, 4, 3, 0, 1, 1, 0, 2, 0, 4, 4, 1, 4, 1, 0, 0, 5, 5, 0, 1, 0, 0,
            2, 0, 4, 1, 2, 5, 3, 1, 4, 1, 5, 4, 4, 3, 1, 3, 3, 1,
        ],
        series1: [
            0, 0, 5, 3, 2, 3, 3, 3, 5, 0, 5, 5, 5, 0, 0, 3, 5, 2, 0, 1, 1, 1, 4, 3, 1, 3, 1, 2, 3, 1, 0, 3, 4, 0, 0, 5,
            4, 0, 0, 1, 1, 3, 3, 3, 1, 3, 0, 1, 3, 0, 3, 2, 3, 2,
        ],
        expected: {
            15: 4,
            16: 2,
            25: 1,
            26: 3,
            35: 7,
            36: 3,
            45: 1,
            46: 2,
            55: 2,
            56: 4,
            65: 3,
            66: 3,
        },
    },
];
