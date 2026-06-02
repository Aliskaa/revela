// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

/**
 * Résout le périmètre coach d'une requête admin : `coachId` quand l'acteur est un
 * coach, `undefined` pour un super-admin (qui voit tout). Centralise l'expression
 * `req.user.scope === 'coach' ? req.user.coachId : undefined` répétée ~25 fois dans
 * la branche admin (cf. ADR-009 §2).
 *
 * Usage : `@CurrentCoachScope() coachId: number | undefined`. La valeur est passée
 * telle quelle au use case, qui applique le filtrage métier par coach.
 */
export const CurrentCoachScope = createParamDecorator((_data: unknown, ctx: ExecutionContext): number | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtValidatedUser }>();
    const user = req.user;
    return user?.scope === 'coach' ? user.coachId : undefined;
});
