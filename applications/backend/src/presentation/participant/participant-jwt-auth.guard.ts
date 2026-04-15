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

import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { JwtValidatedUser } from '@src/presentation/admin/jwt.strategy';

@Injectable()
export class ParticipantJwtAuthGuard extends AuthGuard('jwt') {
    public override handleRequest<TUser = JwtValidatedUser>(
        err: unknown,
        user: unknown,
        _info: unknown,
        _context: ExecutionContext,
        _status?: unknown
    ): TUser {
        if (err || !user) {
            throw err instanceof Error ? err : new UnauthorizedException();
        }
        const u = user as JwtValidatedUser;
        if (u.role !== 'participant' || u.participantId === undefined || !Number.isFinite(u.participantId)) {
            throw new UnauthorizedException();
        }
        return user as TUser;
    }
}
