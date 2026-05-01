// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { NoopScorePersistenceAdapter } from '@aor/adapters';
import {
    CALCULATE_SCORING_USE_CASE_PORT_SYMBOL,
    type IScorePersistencePort,
    SCORE_PERSISTENCE_PORT_SYMBOL,
} from '@aor/ports';
import { CalculateScoringUseCase } from '@src/application/scoring/calculate-scoring.usecase';

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
