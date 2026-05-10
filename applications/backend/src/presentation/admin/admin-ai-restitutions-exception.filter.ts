// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import {
    AiRestitutionGenerationFailedError,
    AiRestitutionNotApprovableError,
    AiRestitutionNotFoundError,
    AiRestitutionPromptNotConfiguredError,
} from '@src/application/ai-restitutions/ai-restitution.errors';

@Catch(
    AiRestitutionPromptNotConfiguredError,
    AiRestitutionNotFoundError,
    AiRestitutionNotApprovableError,
    AiRestitutionGenerationFailedError
)
export class AdminAiRestitutionsExceptionFilter implements ExceptionFilter {
    public catch(
        exception:
            | AiRestitutionPromptNotConfiguredError
            | AiRestitutionNotFoundError
            | AiRestitutionNotApprovableError
            | AiRestitutionGenerationFailedError,
        host: ArgumentsHost
    ): void {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();

        if (exception instanceof AiRestitutionNotFoundError) {
            res.status(HttpStatus.NOT_FOUND).json({ error: exception.message });
            return;
        }
        if (exception instanceof AiRestitutionPromptNotConfiguredError) {
            // 503 plutôt que 500 : la cause est un manque de configuration côté
            // ops, pas un bug applicatif. Le coach peut être informé qu'il faut
            // attendre l'activation côté admin.
            res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ error: exception.message });
            return;
        }
        if (exception instanceof AiRestitutionNotApprovableError) {
            // 422 = sémantique correcte mais état métier incompatible (validateur §9 KO).
            res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                error: exception.message,
                failures: exception.failures,
            });
            return;
        }
        if (exception instanceof AiRestitutionGenerationFailedError) {
            res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
                error: exception.message,
                failures: exception.failures,
            });
        }
    }
}
