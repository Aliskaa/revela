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
    InviteActivationAlreadyCompletedError,
    InviteActivationWeakPasswordError,
    InviteResourceNotFoundError,
    InviteSubmissionValidationError,
    InviteTokenRequestError,
} from '@src/domain/invitations/invitations.errors';

@Catch(
    InviteTokenRequestError,
    InviteSubmissionValidationError,
    InviteResourceNotFoundError,
    InviteActivationWeakPasswordError,
    InviteActivationAlreadyCompletedError
)
export class InvitationsPublicExceptionFilter implements ExceptionFilter {
    public catch(
        exception:
            | InviteTokenRequestError
            | InviteSubmissionValidationError
            | InviteResourceNotFoundError
            | InviteActivationWeakPasswordError
            | InviteActivationAlreadyCompletedError,
        host: ArgumentsHost
    ): void {
        const res = host.switchToHttp().getResponse<Response>();
        if (exception instanceof InviteResourceNotFoundError) {
            res.status(HttpStatus.NOT_FOUND).json({ error: exception.message });
            return;
        }
        if (exception instanceof InviteActivationAlreadyCompletedError) {
            res.status(HttpStatus.CONFLICT).json({ error: exception.message });
            return;
        }
        res.status(HttpStatus.BAD_REQUEST).json({ error: exception.message });
    }
}
