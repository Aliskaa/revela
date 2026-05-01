// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { QuestionnaireNotFoundError } from '@src/domain/questionnaires/questionnaires.errors';

@Catch(QuestionnaireNotFoundError)
export class QuestionnairesExceptionFilter implements ExceptionFilter {
    public catch(_exception: QuestionnaireNotFoundError, host: ArgumentsHost): void {
        const res = host.switchToHttp().getResponse<Response>();
        res.status(HttpStatus.NOT_FOUND).json({});
    }
}
