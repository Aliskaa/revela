// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import {
    ParticipantInvalidCredentialsError,
    ParticipantPasswordNotSetError,
} from '@src/domain/participant/participant-auth.errors';

@Catch(ParticipantInvalidCredentialsError, ParticipantPasswordNotSetError)
export class ParticipantAuthExceptionFilter implements ExceptionFilter {
    public catch(
        exception: ParticipantInvalidCredentialsError | ParticipantPasswordNotSetError,
        host: ArgumentsHost
    ): void {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();

        if (exception instanceof ParticipantInvalidCredentialsError) {
            res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Identifiants incorrects.' });
            return;
        }
        res.status(HttpStatus.FORBIDDEN).json({
            error: 'Compte non activé : définissez votre mot de passe via le lien d’invitation.',
        });
    }
}
