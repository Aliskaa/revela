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

import type { ScoreItemDto } from '@aor/types';

export const SCORE_PERSISTENCE_PORT_SYMBOL = Symbol('SCORE_PERSISTENCE_PORT_SYMBOL');

export type SaveScoringResultCommand = {
    questionnaireId: string;
    scores: ScoreItemDto[];
};

export interface IScorePersistencePort {
    save(command: SaveScoringResultCommand): void;
}
