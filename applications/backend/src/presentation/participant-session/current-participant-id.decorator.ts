// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

/**
 * Extrait le `participantId` d'un JWT validé par {@link ParticipantJwtAuthGuard}.
 *
 * Usage : déclarer `@CurrentParticipantId() participantId: number` comme paramètre
 * de méthode controller. Lance `UnauthorizedException` si le JWT n'a pas (ou plus) de
 * `participantId` exploitable. Le guard est censé filtrer en amont — ce check est
 * une défense en profondeur.
 */
export const CurrentParticipantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtValidatedUser }>();
    const id = req.user?.participantId;
    if (id === undefined || !Number.isFinite(id)) {
        throw new UnauthorizedException();
    }
    return id;
});
