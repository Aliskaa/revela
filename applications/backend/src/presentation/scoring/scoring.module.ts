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

import { Module } from '@nestjs/common';

import { NoopScorePersistenceAdapter } from '@aor/adapters';
import { CalculateScoringUseCase } from '@src/application/scoring/calculate-scoring.usecase';
import {
    CALCULATE_SCORING_USE_CASE_PORT_SYMBOL,
    type IScorePersistencePort,
    SCORE_PERSISTENCE_PORT_SYMBOL,
} from '@aor/ports';

import { ScoringController } from './scoring.controller';

@Module({
    controllers: [ScoringController],
    providers: [
        NoopScorePersistenceAdapter,
        {
            provide: SCORE_PERSISTENCE_PORT_SYMBOL,
            useExisting: NoopScorePersistenceAdapter,
        },
        {
            provide: CALCULATE_SCORING_USE_CASE_PORT_SYMBOL,
            useFactory: (scorePersistence: IScorePersistencePort) => new CalculateScoringUseCase({ scorePersistence }),
            inject: [SCORE_PERSISTENCE_PORT_SYMBOL],
        },
    ],
})
export class ScoringModule {}
