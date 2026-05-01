// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import type { AdminAuthUseCase } from '@src/application/admin/auth/admin-auth.usecase';
import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import {
    RefreshTokenInvalidError,
    type RefreshTokenManagerUseCase,
} from '@src/application/auth/refresh-token-manager.usecase';
import {
    ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
    type IAdminTokenSignerPort,
} from '@src/interfaces/admin/IAdminTokenSigner.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import { ADMIN_COOKIE_NAMES, clearAuthCookies, setAuthCookies } from '@src/presentation/auth/auth-cookies.helper';
import { REFRESH_TOKEN_MANAGER_SYMBOL } from '@src/presentation/auth/auth-refresh.module';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { ADMIN_AUTH_USE_CASE_SYMBOL } from './admin.tokens';

/**
 * subjectId convention pour `refresh_tokens` côté admin :
 *  - super-admin (config env, sans entrée en BDD) → `0`
 *  - coach → l'id de la ligne `coachesTable`
 *
 * Au moment du refresh, on requery le coach (sauf si subjectId=0 → super-admin) pour
 * récupérer scope/coachId/username à jour. Si le coach n'existe plus ou est désactivé, le
 * refresh est rejeté.
 */
const SUPER_ADMIN_SUBJECT_ID = 0;

@ApiTags('admin-auth')
@Controller('admin')
@UseFilters(AdminApplicationExceptionFilter)
export class AdminController {
    public constructor(
        @Inject(ADMIN_AUTH_USE_CASE_SYMBOL) private readonly adminAuth: AdminAuthUseCase,
        @Inject(REFRESH_TOKEN_MANAGER_SYMBOL) private readonly refreshTokens: RefreshTokenManagerUseCase,
        @Inject(ADMIN_TOKEN_SIGNER_PORT_SYMBOL) private readonly tokenSigner: IAdminTokenSignerPort,
        @Inject(COACHES_REPOSITORY_PORT_SYMBOL) private readonly coaches: ICoachesReadPort,
        private readonly audit: AuditLoggerService
    ) {}

    @Post('auth/login')
    @Throttle({ 'auth-strict': { limit: 5, ttl: 60_000 } })
    @ApiOperation({
        summary:
            'Authentification admin — super-admin via env vars ou coach via DB. Pose les cookies httpOnly d’access et de refresh, retourne le scope effectif et le coach_id éventuel.',
    })
    public async login(
        @Body() body: { username?: string; password?: string },
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const username = body.username ?? '';
        const password = body.password ?? '';
        const ipAddress = req.ip ?? null;
        let result: Awaited<ReturnType<AdminAuthUseCase['login']>>;
        try {
            result = await this.adminAuth.login(username, password);
        } catch (err) {
            // G6 audit : trace l'échec en `anonymous` (on ne sait pas si username
            // correspond à un compte légitime — ne pas leak via l'audit).
            void this.audit.record({
                actorType: 'anonymous',
                actorId: null,
                action: 'admin.login.failure',
                resourceType: null,
                resourceId: null,
                payload: { username },
                ipAddress,
            });
            throw err;
        }

        const subjectId = result.coachId ?? SUPER_ADMIN_SUBJECT_ID;
        const refreshIssued = await this.refreshTokens.issue('admin', subjectId);

        setAuthCookies(res, {
            scope: 'admin',
            accessToken: result.accessToken,
            refreshToken: refreshIssued.rawToken,
            refreshExpiresAt: refreshIssued.expiresAt,
        });

        void this.audit.record({
            actorType: result.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: result.coachId ?? null,
            action: 'admin.login.success',
            resourceType: null,
            resourceId: null,
            payload: { scope: result.scope },
            ipAddress,
        });

        // L'access token vit exclusivement dans le cookie httpOnly `aor_admin_access`
        // (G1 RGPD). Le frontend lit ses claims via `GET /admin/auth/me`.
        return {
            scope: result.scope,
            coach_id: result.coachId,
        };
    }

    /**
     * Échange un refresh token (cookie httpOnly `aor_admin_refresh`) contre une nouvelle
     * paire access + refresh. Rotation : l'ancien refresh est marqué `usedAt`. Si le client
     * présente un token déjà utilisé → revoke famille (détection de vol).
     */
    @Post('auth/refresh')
    @Throttle({ 'auth-refresh': { limit: 30, ttl: 60_000 } })
    @ApiOperation({ summary: 'Rotation de la paire de cookies d’authentification admin.' })
    public async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
        const rawRefresh = cookies[ADMIN_COOKIE_NAMES.refresh];
        if (typeof rawRefresh !== 'string' || rawRefresh.length === 0) {
            throw new UnauthorizedException('Refresh token manquant.');
        }
        let rotated: Awaited<ReturnType<RefreshTokenManagerUseCase['rotate']>>;
        try {
            rotated = await this.refreshTokens.rotate(rawRefresh);
        } catch (err) {
            clearAuthCookies(res, 'admin');
            if (err instanceof RefreshTokenInvalidError) {
                throw new UnauthorizedException(err.message);
            }
            throw err;
        }
        if (rotated.subjectType !== 'admin') {
            clearAuthCookies(res, 'admin');
            throw new UnauthorizedException();
        }

        // Re-derive les claims actuels depuis la BDD (pour tenir compte des changements
        // sur le coach : désactivation, renommage…). Si super-admin, claims fixes.
        let accessToken: string;
        let scope: 'super-admin' | 'coach';
        let coachId: number | undefined;
        if (rotated.subjectId === SUPER_ADMIN_SUBJECT_ID) {
            scope = 'super-admin';
            accessToken = this.tokenSigner.sign({ sub: 'super-admin', role: 'admin', scope: 'super-admin' });
        } else {
            const coach = await this.coaches.findById(rotated.subjectId);
            if (!coach || !coach.isActive) {
                clearAuthCookies(res, 'admin');
                throw new UnauthorizedException('Compte coach indisponible.');
            }
            scope = 'coach';
            coachId = coach.id;
            accessToken = this.tokenSigner.sign({
                sub: coach.username,
                role: 'admin',
                scope: 'coach',
                coachId: coach.id,
            });
        }

        setAuthCookies(res, {
            scope: 'admin',
            accessToken,
            refreshToken: rotated.rawToken,
            refreshExpiresAt: rotated.expiresAt,
        });

        return { scope, coach_id: coachId };
    }

    /**
     * Révoque la famille du refresh courant et efface les cookies. Idempotent : un appel sur
     * une session déjà déconnectée renvoie 200 silencieusement.
     */
    @Post('auth/logout')
    @ApiOperation({ summary: 'Déconnexion admin : révoque le refresh courant et efface les cookies.' })
    public async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
        const rawRefresh = cookies[ADMIN_COOKIE_NAMES.refresh];
        if (typeof rawRefresh === 'string' && rawRefresh.length > 0) {
            await this.refreshTokens.revoke(rawRefresh);
        }
        clearAuthCookies(res, 'admin');

        const user = (req as Request & { user?: JwtValidatedUser }).user;
        void this.audit.record({
            actorType: user?.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: user?.coachId ?? null,
            action: 'admin.logout',
            resourceType: null,
            resourceId: null,
            payload: null,
            ipAddress: req.ip ?? null,
        });

        return { ok: true };
    }

    /**
     * Retourne les claims dérivés du JWT courant. Utilisé par le frontend pour connaître
     * son scope/coach_id puisqu'il ne peut plus lire le JWT (il est httpOnly).
     */
    @Get('auth/me')
    @UseGuards(AdminJwtAuthGuard)
    @ApiBearerAuth('jwt')
    @ApiOperation({ summary: 'Claims de l’admin courant (scope, coach_id).' })
    public async me(@Req() req: Request) {
        const user = (req as Request & { user?: JwtValidatedUser }).user;
        if (!user || user.role !== 'admin') {
            throw new UnauthorizedException();
        }
        return {
            scope: user.scope ?? 'super-admin',
            coach_id: user.coachId,
            username: user.username,
        };
    }
}
