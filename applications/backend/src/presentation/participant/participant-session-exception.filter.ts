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
    ParticipantAccountNotFoundError,
    ParticipantAssignedQuestionnaireMissingError,
    ParticipantQuestionnaireNotAllowedError,
} from '@src/domain/participant/participant-session.errors';

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
