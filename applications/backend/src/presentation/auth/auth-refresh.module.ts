// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { RefreshTokenManagerUseCase } from '@src/application/auth/refresh-token-manager.usecase';
import { DrizzleRefreshTokensRepository } from '@src/infrastructure/database/repositories/drizzle-refresh-tokens.repository';
import {
    type IRefreshTokensRepositoryPort,
    REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/auth/IRefreshTokensRepository.port';

export const REFRESH_TOKEN_MANAGER_SYMBOL = Symbol('REFRESH_TOKEN_MANAGER_SYMBOL');

/**
 * Module partagé entre `AdminAuthModule` et `ParticipantModule` pour la gestion des
 * refresh tokens (G1 RGPD). Mutualise le repository Drizzle et le `RefreshTokenManagerUseCase`
 * — ces deux providers fonctionnent indépendamment du scope (admin ou participant), c'est
 * le `subjectType` passé à chaque appel qui distingue.
 */
@Module({
    providers: [
        DrizzleRefreshTokensRepository,
        { provide: REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL, useExisting: DrizzleRefreshTokensRepository },
        {
            provide: REFRESH_TOKEN_MANAGER_SYMBOL,
            useFactory: (repo: IRefreshTokensRepositoryPort) => new RefreshTokenManagerUseCase(repo),
            inject: [REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL],
        },
    ],
    exports: [REFRESH_TOKEN_MANAGER_SYMBOL, REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL],
})
export class AuthRefreshModule {}
