// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { IS_PUBLIC_KEY } from '@src/presentation/public.decorator';

@Injectable()
export class ParticipantJwtAuthGuard extends AuthGuard('jwt') {
    // `@Inject(Reflector)` explicite : `Reflector` reste un import **valeur** (la DI Nest le
    // résout par token, pas par métadonnée de type réfléchie), ce qui évite qu'un `import type`
    // automatique ne casse l'injection au démarrage.
    public constructor(@Inject(Reflector) private readonly reflector: Reflector) {
        super();
    }

    /**
     * Le guard est posé au **niveau classe** sur `ParticipantController` (ADR-009 §2).
     * Les routes d'auth publiques (login / refresh / logout) sont marquées `@Public()` :
     * on court-circuite alors l'authentification au lieu de la subir.
     */
    public override canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }

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
