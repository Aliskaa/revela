// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import {
    AdminCompanyIdRequiredError,
    AdminConfirmationRequiredError,
    AdminCsvFileRequiredError,
    AdminInvalidCredentialsError,
    AdminInvalidQuestionnaireError,
    AdminResourceNotFoundError,
    AdminValidationError,
} from '@src/domain/admin/admin.errors';

@Catch(
    AdminInvalidCredentialsError,
    AdminConfirmationRequiredError,
    AdminResourceNotFoundError,
    AdminInvalidQuestionnaireError,
    AdminCsvFileRequiredError,
    AdminCompanyIdRequiredError,
    AdminValidationError
)
export class AdminApplicationExceptionFilter implements ExceptionFilter {
    public catch(
        exception:
            | AdminInvalidCredentialsError
            | AdminConfirmationRequiredError
            | AdminResourceNotFoundError
            | AdminInvalidQuestionnaireError
            | AdminCsvFileRequiredError
            | AdminCompanyIdRequiredError
            | AdminValidationError,
        host: ArgumentsHost
    ): void {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();

        if (exception instanceof AdminInvalidCredentialsError) {
            res.status(HttpStatus.UNAUTHORIZED).json({ error: exception.message });
            return;
        }
        if (exception instanceof AdminResourceNotFoundError) {
            res.status(HttpStatus.NOT_FOUND).json(exception.message ? { error: exception.message } : {});
            return;
        }
        if (
            exception instanceof AdminConfirmationRequiredError ||
            exception instanceof AdminInvalidQuestionnaireError ||
            exception instanceof AdminCsvFileRequiredError ||
            exception instanceof AdminCompanyIdRequiredError ||
            exception instanceof AdminValidationError
        ) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: exception.message });
        }
    }
}
