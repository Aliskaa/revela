// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { CALCULATE_SCORING_USE_CASE_PORT_SYMBOL, type ICalculateScoringUseCasePort } from '@aor/ports';
import {
    type CalculateScoringRequestDto,
    type CalculateScoringResponseDto,
    calculateScoringRequestDtoSchema,
} from '@aor/types';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('scoring')
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
