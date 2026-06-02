// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { CALCULATE_SCORING_USE_CASE_PORT_SYMBOL, type ICalculateScoringUseCasePort } from '@aor/ports';
import {
    type CalculateScoringRequestDto,
    type CalculateScoringResponseDto,
    calculateScoringRequestDtoSchema,
} from '@aor/types';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ZodValidationPipe } from '@src/presentation/zod-validation.pipe';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
    public constructor(
        @Inject(CALCULATE_SCORING_USE_CASE_PORT_SYMBOL)
        private readonly calculateScoringUseCase: ICalculateScoringUseCasePort
    ) {}

    @Post('calculate')
    @ApiOperation({ summary: 'Calcule les scores d’un questionnaire (B/F/S) à partir des deux séries de réponses.' })
    public calculate(
        @Body(new ZodValidationPipe(calculateScoringRequestDtoSchema)) input: CalculateScoringRequestDto
    ): CalculateScoringResponseDto {
        return this.calculateScoringUseCase.execute(input);
    }
}
