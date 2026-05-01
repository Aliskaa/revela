// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ADMIN_COOKIE_NAMES, PARTICIPANT_COOKIE_NAMES } from '@src/presentation/auth/auth-cookies.helper';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { requireEnv } from '@src/shared/env';

/**
 * Lit l'access token depuis l'un des cookies httpOnly (`aor_admin_access` ou
 * `aor_participant_access`) — G1 RGPD. Le fallback `Authorization: Bearer` a été retiré :
 * tous les clients (frontend Vite, Swagger interactif via cookies posés par login) doivent
 * désormais envoyer leurs cookies via `withCredentials: true`.
 */
const fromCookie =
    (cookieName: string) =>
    (req: Request): string | null => {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
        if (cookies && typeof cookies[cookieName] === 'string' && cookies[cookieName].length > 0) {
            return cookies[cookieName];
        }
        return null;
    };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    public constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                fromCookie(ADMIN_COOKIE_NAMES.access),
                fromCookie(PARTICIPANT_COOKIE_NAMES.access),
            ]),
            ignoreExpiration: false,
            secretOrKey: requireEnv('JWT_SECRET'),
        });
    }

    public validate(payload: { sub: string; role?: string; scope?: string; coachId?: unknown }): JwtValidatedUser {
        const role = payload.role === 'participant' ? 'participant' : 'admin';
        const participantId = role === 'participant' ? Number(payload.sub) : undefined;
        const scope = payload.scope === 'coach' ? 'coach' : role === 'admin' ? 'super-admin' : undefined;
        const coachId = typeof payload.coachId === 'number' ? payload.coachId : undefined;
        return {
            username: payload.sub,
            role,
            scope,
            coachId: Number.isFinite(coachId) ? coachId : undefined,
            participantId: Number.isFinite(participantId) ? participantId : undefined,
        };
    }
}
