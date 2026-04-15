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

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtValidatedUser = {
    username: string;
    role: 'admin' | 'participant';
    scope?: 'super-admin' | 'coach';
    coachId?: number;
    participantId?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    public constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? 'dev-insecure-change-me',
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
