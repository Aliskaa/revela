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

import {
    ResponseRecordNotFoundError,
    ResponsesQuestionnaireNotFoundError,
    ResponsesValidationError,
} from '@src/domain/responses/responses.errors';

@Catch(ResponsesQuestionnaireNotFoundError, ResponsesValidationError, ResponseRecordNotFoundError)
export class ResponsesExceptionFilter implements ExceptionFilter {
    public catch(
        exception: ResponsesQuestionnaireNotFoundError | ResponsesValidationError | ResponseRecordNotFoundError,
        host: ArgumentsHost
    ): void {
        const res = host.switchToHttp().getResponse<Response>();
        if (exception instanceof ResponsesQuestionnaireNotFoundError) {
            res.status(HttpStatus.NOT_FOUND).json({ error: exception.message });
            return;
        }
        if (exception instanceof ResponsesValidationError) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: exception.message });
            return;
        }
        if (exception instanceof ResponseRecordNotFoundError) {
            res.status(HttpStatus.NOT_FOUND).json({});
        }
    }
}
