// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import {
    ParticipantAccountNotFoundError,
    ParticipantAssignedQuestionnaireMissingError,
    ParticipantQuestionnaireNotAllowedError,
} from '@src/domain/participant-session/participant-session.errors';

@Catch(
    ParticipantAccountNotFoundError,
    ParticipantAssignedQuestionnaireMissingError,
    ParticipantQuestionnaireNotAllowedError
)
export class ParticipantSessionExceptionFilter implements ExceptionFilter {
    public catch(
        exception:
            | ParticipantAccountNotFoundError
            | ParticipantAssignedQuestionnaireMissingError
            | ParticipantQuestionnaireNotAllowedError,
        host: ArgumentsHost
    ): void {
        const res = host.switchToHttp().getResponse<Response>();
        if (exception instanceof ParticipantQuestionnaireNotAllowedError) {
            res.status(HttpStatus.FORBIDDEN).json({ error: exception.message });
            return;
        }
        res.status(HttpStatus.NOT_FOUND).json({ error: exception.message });
    }
}
