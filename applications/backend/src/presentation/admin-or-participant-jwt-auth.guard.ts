// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

/**
 * Accepts a valid JWT for either {@link JwtValidatedUser.role} `admin` or `participant`
 * (with a numeric participant id). Used for shared read-only catalogue endpoints.
 */
@Injectable()
export class AdminOrParticipantJwtAuthGuard extends AuthGuard('jwt') {
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
        if (u.role === 'admin') {
            return user as TUser;
        }
        if (u.role === 'participant' && u.participantId !== undefined && Number.isFinite(u.participantId)) {
            return user as TUser;
        }
        throw new UnauthorizedException();
    }
}
