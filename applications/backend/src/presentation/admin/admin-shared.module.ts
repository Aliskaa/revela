// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ScryptPasswordAdapter } from '@aor/adapters';
import { PASSWORD_HASHER_PORT_SYMBOL, PASSWORD_VERIFIER_PORT_SYMBOL } from '@aor/ports';
import { NodemailerMailAdapter } from '@src/infrastructure/mail/nodemailer-mail.adapter';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
    type IAdminTokenSignerPort,
} from '@src/interfaces/admin/IAdminTokenSigner.port';
import {
    CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL,
    type ICutoverStrategyConfigPort,
} from '@src/interfaces/admin/ICutoverStrategyConfig.port';
import { type IInviteUrlConfigPort, INVITE_URL_CONFIG_PORT_SYMBOL } from '@src/interfaces/admin/IInviteUrlConfig.port';
import { MAIL_PORT_SYMBOL } from '@src/interfaces/invitations/IMail.port';
import { requireEnv } from '@src/shared/env';

import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

/**
 * Infrastructure transverse partagée par tous les sous-modules admin :
 * configuration d'auth, JWT, Passport, hashage de mot de passe, envoi d'e-mail.
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: requireEnv('JWT_SECRET'),
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [
        JwtStrategy,
        AdminJwtAuthGuard,
        ScryptPasswordAdapter,
        NodemailerMailAdapter,
        { provide: PASSWORD_HASHER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        { provide: PASSWORD_VERIFIER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        { provide: MAIL_PORT_SYMBOL, useExisting: NodemailerMailAdapter },
        {
            provide: ADMIN_AUTH_CONFIG_PORT_SYMBOL,
            useFactory: (): IAdminAuthConfigPort => ({
                superAdminUsername: requireEnv('ADMIN_USERNAME'),
                superAdminPassword: requireEnv('ADMIN_PASSWORD'),
            }),
        },
        {
            provide: INVITE_URL_CONFIG_PORT_SYMBOL,
            useFactory: (): IInviteUrlConfigPort => ({
                frontendBaseUrl: requireEnv('FRONTEND_URL'),
            }),
        },
        {
            provide: CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL,
            useFactory: (): ICutoverStrategyConfigPort => {
                const strategy = process.env.ADMIN_CUTOVER_STRATEGY;
                if (strategy === 'dual-run' || strategy === 'new-flow') {
                    return { strategy };
                }
                return { strategy: 'legacy' };
            },
        },
        {
            provide: ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
            useFactory: (jwtService: JwtService): IAdminTokenSignerPort => ({
                sign: (payload: { sub: string; role: 'admin'; scope: 'super-admin' | 'coach'; coachId?: number }) =>
                    jwtService.sign(payload),
            }),
            inject: [JwtService],
        },
    ],
    exports: [
        JwtModule,
        PassportModule,
        AdminJwtAuthGuard,
        PASSWORD_HASHER_PORT_SYMBOL,
        PASSWORD_VERIFIER_PORT_SYMBOL,
        MAIL_PORT_SYMBOL,
        ADMIN_AUTH_CONFIG_PORT_SYMBOL,
        INVITE_URL_CONFIG_PORT_SYMBOL,
        CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL,
        ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
    ],
})
export class AdminSharedModule {}
