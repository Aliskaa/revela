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

import { CALCULATE_SCORING_USE_CASE_PORT_SYMBOL, type ICalculateScoringUseCasePort } from '@aor/ports';
import {
    type CalculateScoringRequestDto,
    type CalculateScoringResponseDto,
    calculateScoringRequestDtoSchema,
} from '@aor/types';
import { Body, Controller, Inject, Post } from '@nestjs/common';

@Controller('scoring')
export class ScoringController {
    public constructor(
        @Inject(CALCULATE_SCORING_USE_CASE_PORT_SYMBOL)
        private readonly calculateScoringUseCase: ICalculateScoringUseCasePort
    ) {}

    @Post('calculate')
    public calculate(@Body() payload: CalculateScoringRequestDto): CalculateScoringResponseDto {
        const input = calculateScoringRequestDtoSchema.parse(payload);
        return this.calculateScoringUseCase.execute(input);
    }
}
