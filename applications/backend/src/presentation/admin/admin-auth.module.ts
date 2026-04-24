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

import { Module } from '@nestjs/common';

import { IPasswordVerifierPort, PASSWORD_VERIFIER_PORT_SYMBOL } from '@aor/ports';
import { AdminAuthUseCase } from '@src/application/admin/auth/admin-auth.usecase';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
    type IAdminTokenSignerPort,
} from '@src/interfaces/admin/IAdminTokenSigner.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

import { AdminSharedModule } from './admin-shared.module';
import { AdminController } from './admin.controller';
import { ADMIN_AUTH_USE_CASE_SYMBOL } from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminController],
    providers: [
        {
            provide: ADMIN_AUTH_USE_CASE_SYMBOL,
            useFactory: (
                authConfig: IAdminAuthConfigPort,
                signer: IAdminTokenSignerPort,
                coaches: ICoachesReadPort,
                passwordVerifier: IPasswordVerifierPort
            ) => new AdminAuthUseCase({ authConfig, tokenSigner: signer, coaches, passwordVerifier }),
            inject: [
                ADMIN_AUTH_CONFIG_PORT_SYMBOL,
                ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
                PASSWORD_VERIFIER_PORT_SYMBOL,
            ],
        },
    ],
})
export class AdminAuthModule {}
