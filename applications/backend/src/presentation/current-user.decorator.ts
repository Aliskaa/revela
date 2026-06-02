// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

/**
 * Expose le `req.user` validé (forme {@link JwtValidatedUser}) comme paramètre de
 * méthode controller, sans réintroduire `@Req() req: { user: JwtValidatedUser }`
 * typé inline partout (cf. ADR-009 §2).
 *
 * Usage : `@CurrentUser() user: JwtValidatedUser`. Lance `UnauthorizedException` si
 * le `req.user` est absent — le guard d'authentification est censé filtrer en amont,
 * ce check est une défense en profondeur (même posture que {@link CurrentParticipantId}).
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtValidatedUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtValidatedUser }>();
    if (!req.user) {
        throw new UnauthorizedException();
    }
    return req.user;
});
