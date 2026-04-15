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
