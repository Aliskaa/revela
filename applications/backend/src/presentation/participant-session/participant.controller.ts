// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { updateParticipantProfileBodySchema } from '@aor/types';
import {
    RefreshTokenInvalidError,
    type RefreshTokenManagerUseCase,
} from '@src/application/auth/refresh-token-manager.usecase';
import type { ConfirmCampaignParticipationUseCase } from '@src/application/participant-session/confirm-campaign-participation.usecase';
import type { ExportParticipantSelfDataUseCase } from '@src/application/participant-session/export-participant-self-data.usecase';
import type { GetParticipantSessionQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-session-questionnaire-matrix.usecase';
import type { GetParticipantSessionUseCase } from '@src/application/participant-session/get-participant-session.usecase';
import type { ListParticipantCampaignPeersUseCase } from '@src/application/participant-session/list-participant-campaign-peers.usecase';
import type { ParticipantLoginUseCase } from '@src/application/participant-session/participant-login.usecase';
import type { GetParticipantOwnedResponseUseCase } from '@src/application/responses/get-participant-owned-response.usecase';
import type { SubmitParticipantQuestionnaireUseCase } from '@src/application/responses/submit-participant-questionnaire.usecase';
import {
    type IParticipantJwtSignerPort,
    PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
} from '@src/interfaces/participant-session/IParticipantJwtSigner.port';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import { PARTICIPANTS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/participants/IParticipantsRepository.port';
import { PARTICIPANT_COOKIE_NAMES, clearAuthCookies, setAuthCookies } from '@src/presentation/auth/auth-cookies.helper';
import { REFRESH_TOKEN_MANAGER_SYMBOL } from '@src/presentation/auth/auth-refresh.module';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { CurrentParticipantId } from './current-participant-id.decorator';
import { ParticipantAuthExceptionFilter } from './participant-auth-exception.filter';
import { ParticipantJwtAuthGuard } from './participant-jwt-auth.guard';
import { ParticipantSessionExceptionFilter } from './participant-session-exception.filter';
import {
    CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL,
    EXPORT_PARTICIPANT_SELF_DATA_USE_CASE_SYMBOL,
    GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL,
    PARTICIPANT_LOGIN_USE_CASE_SYMBOL,
    SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL,
} from './participant.tokens';

@ApiTags('participant')
@ApiBearerAuth('jwt')
@Controller('participant')
export class ParticipantController {
    public constructor(
        @Inject(PARTICIPANT_LOGIN_USE_CASE_SYMBOL)
        private readonly participantLogin: ParticipantLoginUseCase,
        @Inject(SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL)
        private readonly submitParticipantQuestionnaire: SubmitParticipantQuestionnaireUseCase,
        @Inject(GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL)
        private readonly getParticipantOwnedResponse: GetParticipantOwnedResponseUseCase,
        @Inject(GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL)
        private readonly getParticipantSession: GetParticipantSessionUseCase,
        @Inject(GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL)
        private readonly getParticipantSessionMatrix: GetParticipantSessionQuestionnaireMatrixUseCase,
        @Inject(LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL)
        private readonly listParticipantCampaignPeers: ListParticipantCampaignPeersUseCase,
        @Inject(CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL)
        private readonly confirmCampaignParticipation: ConfirmCampaignParticipationUseCase,
        @Inject(EXPORT_PARTICIPANT_SELF_DATA_USE_CASE_SYMBOL)
        private readonly exportParticipantSelfData: ExportParticipantSelfDataUseCase,
        @Inject(REFRESH_TOKEN_MANAGER_SYMBOL)
        private readonly refreshTokens: RefreshTokenManagerUseCase,
        @Inject(PARTICIPANT_JWT_SIGNER_PORT_SYMBOL)
        private readonly participantJwtSigner: IParticipantJwtSignerPort,
        @Inject(PARTICIPANTS_REPOSITORY_PORT_SYMBOL)
        private readonly participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort
    ) {}

    private static normalizeQid(raw?: string): string | undefined {
        const qid = (raw ?? '').trim().toUpperCase();
        return qid.length > 0 ? qid : undefined;
    }

    @Post('auth/login')
    @UseFilters(ParticipantAuthExceptionFilter)
    public async login(@Body() body: { email?: string; password?: string }, @Res({ passthrough: true }) res: Response) {
        const email = body.email ?? '';
        const password = body.password ?? '';
        const result = await this.participantLogin.execute(email, password);

        // Le JWT participant encode `sub = participantId`. On utilise donc le même ID comme
        // subjectId du refresh token pour pouvoir relier les deux sans champ supplémentaire.
        const participantId = Number(result.participantId ?? 0);
        const refreshIssued = await this.refreshTokens.issue('participant', participantId);

        setAuthCookies(res, {
            scope: 'participant',
            accessToken: result.accessToken,
            refreshToken: refreshIssued.rawToken,
            refreshExpiresAt: refreshIssued.expiresAt,
        });

        // L'access token vit exclusivement dans le cookie httpOnly `aor_participant_access`
        // (G1 RGPD). Le frontend lit ses claims via `GET /participant/auth/me`.
        return { participant_id: participantId };
    }

    /**
     * Échange le refresh cookie participant contre une nouvelle paire access + refresh.
     * Rotation : ancien token marqué `usedAt`. Réutilisation détectée → revoke famille.
     */
    @Post('auth/refresh')
    public async refreshAuth(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
        const rawRefresh = cookies[PARTICIPANT_COOKIE_NAMES.refresh];
        if (typeof rawRefresh !== 'string' || rawRefresh.length === 0) {
            throw new UnauthorizedException('Refresh token manquant.');
        }
        let rotated: Awaited<ReturnType<RefreshTokenManagerUseCase['rotate']>>;
        try {
            rotated = await this.refreshTokens.rotate(rawRefresh);
        } catch (err) {
            clearAuthCookies(res, 'participant');
            if (err instanceof RefreshTokenInvalidError) {
                throw new UnauthorizedException(err.message);
            }
            throw err;
        }
        if (rotated.subjectType !== 'participant') {
            clearAuthCookies(res, 'participant');
            throw new UnauthorizedException();
        }

        // Vérifie que le compte participant existe toujours (pas effacé RGPD entre-temps).
        const participant = await this.participants.findById(rotated.subjectId);
        if (!participant) {
            clearAuthCookies(res, 'participant');
            throw new UnauthorizedException('Compte participant indisponible.');
        }

        const accessToken = this.participantJwtSigner.signAccessToken(rotated.subjectId);

        setAuthCookies(res, {
            scope: 'participant',
            accessToken,
            refreshToken: rotated.rawToken,
            refreshExpiresAt: rotated.expiresAt,
        });

        return { participant_id: rotated.subjectId };
    }

    /** Déconnexion participant : révoque la famille du refresh courant et efface les cookies. */
    @Post('auth/logout')
    public async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
        const rawRefresh = cookies[PARTICIPANT_COOKIE_NAMES.refresh];
        if (typeof rawRefresh === 'string' && rawRefresh.length > 0) {
            await this.refreshTokens.revoke(rawRefresh);
        }
        clearAuthCookies(res, 'participant');
        return { ok: true };
    }

    /** Claims dérivés du JWT participant courant. */
    @Get('auth/me')
    @UseGuards(ParticipantJwtAuthGuard)
    public async me(@Req() req: Request) {
        const user = (req as Request & { user?: JwtValidatedUser }).user;
        if (!user || user.role !== 'participant' || user.participantId === undefined) {
            throw new UnauthorizedException();
        }
        return { participant_id: user.participantId };
    }

    @Get('session')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async session(@CurrentParticipantId() participantId: number) {
        return this.getParticipantSession.execute(participantId);
    }

    @Patch('profile')
    @UseGuards(ParticipantJwtAuthGuard)
    public async updateProfile(@CurrentParticipantId() participantId: number, @Body() body: unknown) {
        const parsed = updateParticipantProfileBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException('Données de profil invalides.');
        }
        const data = parsed.data;
        const current = await this.participants.findById(participantId);
        if (!current) {
            throw new UnauthorizedException();
        }
        const updated = current.updateProfile({
            ...(data.organisation !== undefined ? { organisation: data.organisation } : {}),
            ...(data.direction !== undefined ? { direction: data.direction } : {}),
            ...(data.service !== undefined ? { service: data.service } : {}),
            ...(data.function_level !== undefined ? { functionLevel: data.function_level } : {}),
        });
        await this.participants.save(updated);
        return { ok: true };
    }

    @Get('campaigns/:campaignId/matrix')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async campaignMatrix(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Query('qid') qid?: string
    ) {
        const normalizedQid = ParticipantController.normalizeQid(qid);
        return this.getParticipantSessionMatrix.execute(participantId, normalizedQid, campaignId);
    }

    @Post('campaigns/:campaignId/confirm')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async confirmCampaign(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        return this.confirmCampaignParticipation.execute(participantId, campaignId);
    }

    @Get('campaigns/:campaignId/peers')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async campaignPeers(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        return this.listParticipantCampaignPeers.execute(participantId, campaignId);
    }

    @Post('campaigns/:campaignId/questionnaires/:qid/submit')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ResponsesExceptionFilter)
    public async submitCampaignQuestionnaire(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('qid') qid: string,
        @Body() body: unknown
    ) {
        return this.submitParticipantQuestionnaire.execute(participantId, qid, body, campaignId);
    }

    @Get('responses/:responseId')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ResponsesExceptionFilter)
    public async getResponse(
        @CurrentParticipantId() participantId: number,
        @Param('responseId', ParseIntPipe) responseId: number
    ) {
        return this.getParticipantOwnedResponse.execute(participantId, responseId);
    }

    /**
     * Export RGPD « mes données » (Articles 15 et 20 du RGPD). Retourne un JSON agrégeant
     * profil, métadonnées RH, assignations campagnes et toutes les réponses dans lesquelles
     * le participant authentifié est impliqué.
     *
     * Le frontend consomme cette donnée pour proposer un téléchargement JSON brut **et**
     * un rendu PDF (jsPDF, généré côté client à partir du même JSON).
     */
    @Get('me/export')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async exportMyData(@CurrentParticipantId() participantId: number) {
        return this.exportParticipantSelfData.execute(participantId);
    }
}
