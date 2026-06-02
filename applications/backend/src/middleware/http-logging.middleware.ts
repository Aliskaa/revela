// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Logger } from '@aor/logger';
import type { NextFunction, Request, Response } from 'express';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

/**
 * Middleware Express qui log une ligne par requête HTTP (méthode, URL, status, durée, IP,
 * user authentifié, taille). Le log est émis sur `res.on('finish')` pour capturer le vrai
 * status final (après exception filters Nest). Le path `/health` est ignoré pour ne pas
 * spammer les healthchecks AWS/Docker.
 *
 * Niveau du log : INFO pour 2xx/3xx, WARN pour 4xx, ERROR pour 5xx.
 *
 * `req.user` est posé par `JwtStrategy` (Passport) quand l'endpoint passe le guard d'auth ;
 * sur les routes publiques (login, healthcheck), il reste `undefined`.
 */
export function createHttpLoggingMiddleware(logger: Logger) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (req.url === '/health') {
            next();
            return;
        }
        const start = Date.now();
        res.on('finish', () => {
            const ms = Date.now() - start;
            const status = res.statusCode;
            const user = (req as Request & { user?: JwtValidatedUser }).user;
            const meta: Record<string, unknown> = { ip: req.ip ?? 'unknown', ms };
            if (user !== undefined) {
                meta.user =
                    user.role === 'admin'
                        ? `${user.scope ?? 'admin'}:${user.coachId ?? user.username}`
                        : `participant:${user.participantId ?? user.username}`;
            }
            const contentLength = res.getHeader('content-length');
            if (contentLength !== undefined) {
                meta.size = Number(contentLength);
            }
            const line = `${req.method} ${req.originalUrl} ${status}`;
            if (status >= 500) {
                logger.error(line, meta);
            } else if (status >= 400) {
                logger.warn(line, meta);
            } else {
                logger.info(line, meta);
            }
        });
        next();
    };
}
