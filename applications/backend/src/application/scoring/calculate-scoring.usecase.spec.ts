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

import type { IScorePersistencePort, SaveScoringResultCommand } from '@aor/ports';
import { expect, test } from 'vitest';

import { CalculateScoringUseCase } from './calculate-scoring.usecase';
import { PARITY_FIXTURES } from './testing/parity.fixtures';

class StubScorePersistence implements IScorePersistencePort {
    public readonly saved: SaveScoringResultCommand[] = [];

    public save(command: SaveScoringResultCommand): void {
        this.saved.push(command);
    }
}

test('calculate scoring use case matches Python parity fixtures and persists', () => {
    const scorePersistencePort = new StubScorePersistence();
    const useCase = new CalculateScoringUseCase({ scorePersistence: scorePersistencePort });

    for (const fixture of PARITY_FIXTURES) {
        const actual = useCase.execute({
            questionnaireId: fixture.questionnaireId,
            series0: fixture.series0,
            series1: fixture.series1,
        });

        const asRecord = Object.fromEntries(actual.scores.map(score => [score.scoreKey, score.value]));
        expect(asRecord).toEqual(fixture.expected);
    }

    expect(scorePersistencePort.saved).toHaveLength(PARITY_FIXTURES.length);
});
