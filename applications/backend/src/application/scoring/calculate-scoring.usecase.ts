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

import { calculateScores } from '@aor/scoring';
import type { CalculateScoringRequestDto, CalculateScoringResponseDto, ScoreItemDto } from '@aor/types';

import type { ICalculateScoringUseCasePort } from '@aor/ports';
import type { IScorePersistencePort } from '@aor/ports';

export class CalculateScoringUseCase implements ICalculateScoringUseCasePort {
    public constructor(private readonly ports: { readonly scorePersistence: IScorePersistencePort }) {}

    public execute(input: CalculateScoringRequestDto): CalculateScoringResponseDto {
        const result = calculateScores(input.questionnaireId, input.series0, input.series1);
        const scores: ScoreItemDto[] = Object.entries(result).map(([scoreKey, value]) => ({
            scoreKey: Number(scoreKey),
            value,
        }));

        const response = {
            questionnaireId: input.questionnaireId,
            scores: scores.sort((left, right) => left.scoreKey - right.scoreKey),
        };
        this.ports.scorePersistence.save(response);
        return response;
    }
}
