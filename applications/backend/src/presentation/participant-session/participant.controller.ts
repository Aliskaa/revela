// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { updateParticipantProfileBodySchema } from '@aor/types';
import type { GetOwnParticipantAiRestitutionUseCase } from '@src/application/ai-restitutions/get-own-participant-ai-restitution.usecase';
import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import {
    RefreshTokenInvalidError,
    type RefreshTokenManagerUseCase,
} from '@src/application/auth/refresh-token-manager.usecase';
import type { ConfirmCampaignParticipationUseCase } from '@src/application/participant-session/confirm-campaign-participation.usecase';
import type { ConfirmPeerFeedbackUseCase } from '@src/application/participant-session/confirm-peer-feedback.usecase';
import type { ExportParticipantSelfDataUseCase } from '@src/application/participant-session/export-participant-self-data.usecase';
import type { GetParticipantCampaignCoachAvatarUseCase } from '@src/application/participant-session/get-participant-campaign-coach-avatar.usecase';
import type { GetParticipantCampaignPeerAvatarUseCase } from '@src/application/participant-session/get-participant-campaign-peer-avatar.usecase';
import type { GetParticipantSessionQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-session-questionnaire-matrix.usecase';
import type { GetParticipantSessionUseCase } from '@src/application/participant-session/get-participant-session.usecase';
import type { ListParticipantCampaignPeersUseCase } from '@src/application/participant-session/list-participant-campaign-peers.usecase';
import type { ParticipantLoginUseCase } from '@src/application/participant-session/participant-login.usecase';
import type {
    GetParticipantAvatarUseCase,
    UploadParticipantAvatarUseCase,
} from '@src/application/participant-session/upload-participant-avatar.usecase';
import type { GetParticipantElementBDraftUseCase } from '@src/application/responses/get-participant-element-b-draft.usecase';
import type { GetParticipantOwnedResponseUseCase } from '@src/application/responses/get-participant-owned-response.usecase';
import type { SubmitParticipantQuestionnaireUseCase } from '@src/application/responses/submit-participant-questionnaire.usecase';
import type { UpsertParticipantElementBDraftUseCase } from '@src/application/responses/upsert-participant-element-b-draft.usecase';
import type { GetOwnParticipantTransparencyScoreUseCase } from '@src/application/transparency/get-own-participant-transparency-score.usecase';
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
import { sendAvatarResponse } from '@src/presentation/avatar-response';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';
import { transparencyScoreSnapshotToJson } from '@src/presentation/transparency-snapshot.presenter';

import { Public } from '@src/presentation/public.decorator';
import { CurrentParticipantId } from './current-participant-id.decorator';
import { ParticipantAuthExceptionFilter } from './participant-auth-exception.filter';
import { ParticipantAvatarExceptionFilter } from './participant-avatar-exception.filter';

import { ParticipantJwtAuthGuard } from './participant-jwt-auth.guard';
import { ParticipantSessionExceptionFilter } from './participant-session-exception.filter';
import {
    CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL,
    CONFIRM_PEER_FEEDBACK_USE_CASE_SYMBOL,
    EXPORT_PARTICIPANT_SELF_DATA_USE_CASE_SYMBOL,
    GET_OWN_PARTICIPANT_AI_RESTITUTION_USE_CASE_SYMBOL,
    GET_OWN_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    GET_PARTICIPANT_AVATAR_USE_CASE_SYMBOL,
    GET_PARTICIPANT_CAMPAIGN_COACH_AVATAR_USE_CASE_SYMBOL,
    GET_PARTICIPANT_CAMPAIGN_PEER_AVATAR_USE_CASE_SYMBOL,
    GET_PARTICIPANT_ELEMENT_B_DRAFT_USE_CASE_SYMBOL,
    GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL,
    PARTICIPANT_LOGIN_USE_CASE_SYMBOL,
    SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL,
    UPLOAD_PARTICIPANT_AVATAR_USE_CASE_SYMBOL,
    UPSERT_PARTICIPANT_ELEMENT_B_DRAFT_USE_CASE_SYMBOL,
} from './participant.tokens';

@ApiTags('participant')
@ApiBearerAuth('jwt')
@Controller('participant')
// Guard d'authentification au niveau classe (ADR-009 §2, comme la branche admin de ressources) :
// toutes les routes sont protégées par défaut. Les seules exceptions — les routes d'auth
// `login` / `refresh` / `logout` — sont marquées `@Public()` de façon explicite, ce qui
// supprime les 18 `@UseGuards` par méthode (plus aucun handler protégé ne dépend d'un guard oublié).
@UseGuards(ParticipantJwtAuthGuard)
// Filtres au niveau classe (pattern cible ADR-009 §3, comme la branche admin). Les quatre
// filtres capturent des types d'erreurs **disjoints** (auth / session / avatar / responses) :
// les empiler ici est sans effet de bord — chaque exception n'est routée que vers son filtre.
@UseFilters(
    ParticipantAuthExceptionFilter,
    ParticipantSessionExceptionFilter,
    ParticipantAvatarExceptionFilter,
    ResponsesExceptionFilter
)
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
        @Inject(CONFIRM_PEER_FEEDBACK_USE_CASE_SYMBOL)
        private readonly confirmPeerFeedback: ConfirmPeerFeedbackUseCase,
        @Inject(EXPORT_PARTICIPANT_SELF_DATA_USE_CASE_SYMBOL)
        private readonly exportParticipantSelfData: ExportParticipantSelfDataUseCase,
        @Inject(GET_OWN_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL)
        private readonly getOwnParticipantTransparencyScore: GetOwnParticipantTransparencyScoreUseCase,
        @Inject(GET_OWN_PARTICIPANT_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly getOwnParticipantAiRestitution: GetOwnParticipantAiRestitutionUseCase,
        @Inject(GET_PARTICIPANT_ELEMENT_B_DRAFT_USE_CASE_SYMBOL)
        private readonly getParticipantElementBDraft: GetParticipantElementBDraftUseCase,
        @Inject(UPSERT_PARTICIPANT_ELEMENT_B_DRAFT_USE_CASE_SYMBOL)
        private readonly upsertParticipantElementBDraft: UpsertParticipantElementBDraftUseCase,
        @Inject(REFRESH_TOKEN_MANAGER_SYMBOL)
        private readonly refreshTokens: RefreshTokenManagerUseCase,
        @Inject(PARTICIPANT_JWT_SIGNER_PORT_SYMBOL)
        private readonly participantJwtSigner: IParticipantJwtSignerPort,
        @Inject(PARTICIPANTS_REPOSITORY_PORT_SYMBOL)
        private readonly participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort,
        @Inject(UPLOAD_PARTICIPANT_AVATAR_USE_CASE_SYMBOL)
        private readonly uploadParticipantAvatar: UploadParticipantAvatarUseCase,
        @Inject(GET_PARTICIPANT_AVATAR_USE_CASE_SYMBOL)
        private readonly getParticipantAvatar: GetParticipantAvatarUseCase,
        @Inject(GET_PARTICIPANT_CAMPAIGN_PEER_AVATAR_USE_CASE_SYMBOL)
        private readonly getParticipantCampaignPeerAvatar: GetParticipantCampaignPeerAvatarUseCase,
        @Inject(GET_PARTICIPANT_CAMPAIGN_COACH_AVATAR_USE_CASE_SYMBOL)
        private readonly getParticipantCampaignCoachAvatar: GetParticipantCampaignCoachAvatarUseCase,
        private readonly audit: AuditLoggerService
    ) {}

    @Post('auth/login')
    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ 'auth-strict': { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Authentification participant : pose les cookies httpOnly et ouvre une session.' })
    public async login(
        @Body() body: { email?: string; password?: string },
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const email = body.email ?? '';
        const password = body.password ?? '';
        const ipAddress = req.ip ?? null;

        let result: Awaited<ReturnType<ParticipantLoginUseCase['execute']>>;
        try {
            result = await this.participantLogin.execute(email, password);
        } catch (err) {
            // G6 audit : échec login en `anonymous` (ne pas leak l'existence du compte).
            void this.audit.record({
                actorType: 'anonymous',
                actorId: null,
                action: 'participant.login.failure',
                resourceType: null,
                resourceId: null,
                payload: { email },
                ipAddress,
            });
            throw err;
        }

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

        void this.audit.record({
            actorType: 'participant',
            actorId: participantId,
            action: 'participant.login.success',
            resourceType: null,
            resourceId: null,
            payload: null,
            ipAddress,
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
    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ 'auth-refresh': { limit: 30, ttl: 60_000 } })
    @ApiOperation({ summary: 'Rotation de la paire de cookies d’authentification participant.' })
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
    @Public()
    @ApiOperation({ summary: 'Déconnexion participant : révoque le refresh courant et efface les cookies.' })
    public async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
        const rawRefresh = cookies[PARTICIPANT_COOKIE_NAMES.refresh];
        if (typeof rawRefresh === 'string' && rawRefresh.length > 0) {
            await this.refreshTokens.revoke(rawRefresh);
        }
        clearAuthCookies(res, 'participant');

        const user = (req as Request & { user?: JwtValidatedUser }).user;
        void this.audit.record({
            actorType: 'participant',
            actorId: user?.participantId ?? null,
            action: 'participant.logout',
            resourceType: null,
            resourceId: null,
            payload: null,
            ipAddress: req.ip ?? null,
        });

        return { ok: true };
    }

    /** Claims dérivés du JWT participant courant. */
    @Get('auth/me')
    @ApiOperation({ summary: 'Claims du participant courant.' })
    public async me(@Req() req: Request) {
        const user = (req as Request & { user?: JwtValidatedUser }).user;
        if (!user || user.role !== 'participant' || user.participantId === undefined) {
            throw new UnauthorizedException();
        }
        return { participant_id: user.participantId };
    }

    @Get('session')
    @ApiOperation({ summary: 'Session du participant courant (campagnes et assignations).' })
    public async session(@CurrentParticipantId() participantId: number) {
        return this.getParticipantSession.execute(participantId);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Met à jour le profil du participant courant.' })
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

    @Post('profile/avatar')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 2 * 1024 * 1024 },
        })
    )
    @ApiOperation({ summary: 'Met à jour l’avatar du participant courant.' })
    public async uploadAvatar(
        @CurrentParticipantId() participantId: number,
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        return this.uploadParticipantAvatar.execute(participantId, file);
    }

    // Lecture de l'avatar « moi » sous `/participant/profile/avatar` (ADR-010 R4 : pas de `/me`
    // redondant sous un namespace déjà self). Même chemin que le `POST` d'upload, verbe distinct.
    @Get('profile/avatar')
    @ApiOperation({ summary: 'Récupère l’avatar du participant courant.' })
    public async getOwnAvatar(@CurrentParticipantId() participantId: number, @Res() res: Response) {
        const avatar = await this.getParticipantAvatar.execute(participantId);
        sendAvatarResponse(res, avatar);
    }

    // `qid` supprimé de la query (ADR-010 R2, 3ᵉ catégorie) : une campagne ne porte qu'un seul
    // questionnaire, le use case le dérive de l'assignation. Seul `peers` reste (paramètre de vue).
    @Get('campaigns/:campaignId/matrix')
    @ApiOperation({ summary: 'Matrice des réponses du participant courant pour une campagne.' })
    public async campaignMatrix(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Query('peers') peers?: string
    ) {
        const peerColumnPerspective = peers === 'received' ? 'received' : 'given';
        return this.getParticipantSessionMatrix.execute(participantId, campaignId, peerColumnPerspective);
    }

    @Post('campaigns/:campaignId/confirm')
    @ApiOperation({ summary: 'Confirme la participation du participant courant à une campagne.' })
    public async confirmCampaign(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        return this.confirmCampaignParticipation.execute(participantId, campaignId);
    }

    @Get('campaigns/:campaignId/peers')
    @ApiOperation({ summary: 'Liste les pairs du participant courant dans une campagne.' })
    public async campaignPeers(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        return this.listParticipantCampaignPeers.execute(participantId, campaignId);
    }

    @Get('campaigns/:campaignId/coach/avatar')
    @ApiOperation({ summary: 'Récupère l’avatar du coach d’une campagne.' })
    public async getCampaignCoachAvatar(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Res() res: Response
    ) {
        const avatar = await this.getParticipantCampaignCoachAvatar.execute(participantId, campaignId);
        sendAvatarResponse(res, avatar);
    }

    @Get('campaigns/:campaignId/peers/:peerParticipantId/avatar')
    @ApiOperation({ summary: 'Récupère l’avatar d’un pair dans une campagne.' })
    public async getCampaignPeerAvatar(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('peerParticipantId', ParseIntPipe) peerParticipantId: number,
        @Res() res: Response
    ) {
        const avatar = await this.getParticipantCampaignPeerAvatar.execute(
            participantId,
            campaignId,
            peerParticipantId
        );
        sendAvatarResponse(res, avatar);
    }

    /**
     * Lecture du score de transparence (P23) du participant authentifié.
     * Retourne `{ snapshot: null }` tant que le coach/admin n'a pas activé le calcul.
     */
    @Get('campaigns/:campaignId/transparency')
    @ApiOperation({ summary: 'Lit le score de transparence (P23) du participant courant pour une campagne.' })
    public async campaignTransparency(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        const snapshot = await this.getOwnParticipantTransparencyScore.execute(participantId, campaignId);
        return { snapshot: snapshot ? transparencyScoreSnapshotToJson(snapshot) : null };
    }

    /**
     * Lecture de la restitution IA (Niveau 3 résultats §10 PDF) du participant
     * authentifié. 404 tant que le coach n'a pas explicitement approuvé —
     * la diffusion est contrôlée (décision Laurent 2026-05-10).
     */
    @Get('campaigns/:campaignId/restitution')
    @ApiOperation({ summary: 'Lit la restitution IA approuvée du participant courant pour une campagne.' })
    public async campaignAiRestitution(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        const view = await this.getOwnParticipantAiRestitution.execute({ participantId, campaignId });
        if (!view) {
            throw new NotFoundException('Aucune restitution disponible pour cette campagne.');
        }
        return view;
    }

    @Post('campaigns/:campaignId/peer-feedback/confirm')
    @ApiOperation({ summary: 'Confirme le feedback entre pairs du participant courant pour une campagne.' })
    public async confirmCampaignPeerFeedback(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        return this.confirmPeerFeedback.execute(participantId, campaignId);
    }

    @Post('campaigns/:campaignId/questionnaires/:qid/submit')
    @ApiOperation({ summary: 'Soumet les réponses d’un questionnaire dans une campagne.' })
    public async submitCampaignQuestionnaire(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('qid') qid: string,
        @Body() body: unknown
    ) {
        return this.submitParticipantQuestionnaire.execute(participantId, qid, body, campaignId);
    }

    /**
     * Brouillon Élément Humain (autosave). Le frontend le PUT à la fin de la série 0
     * (54 réponses) pour qu'une déconnexion entre la série 0 et la série 1 ne fasse
     * pas tout perdre. Le brouillon est supprimé automatiquement après la soumission
     * finale (`/questionnaires/:qid/submit`).
     */
    @Get('campaigns/:campaignId/questionnaires/:qid/draft')
    @ApiOperation({ summary: 'Lit le brouillon (autosave) d’un questionnaire dans une campagne.' })
    public async getCampaignQuestionnaireDraft(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('qid') qid: string
    ) {
        const draft = await this.getParticipantElementBDraft.execute(participantId, campaignId, qid);
        return { draft };
    }

    @Put('campaigns/:campaignId/questionnaires/:qid/draft')
    @ApiOperation({ summary: 'Enregistre le brouillon (autosave) d’un questionnaire dans une campagne.' })
    public async upsertCampaignQuestionnaireDraft(
        @CurrentParticipantId() participantId: number,
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('qid') qid: string,
        @Body() body: unknown
    ) {
        const draft = await this.upsertParticipantElementBDraft.execute(participantId, campaignId, qid, body);
        return { draft };
    }

    @Get('responses/:responseId')
    @ApiOperation({ summary: 'Lit une réponse appartenant au participant courant.' })
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
    // Export « mes données » sous `/participant/export` (ADR-010 R4/R6 : suffixe de ressource,
    // pas de `/me` redondant sous un namespace déjà self), ex-`/me/export`.
    @Get('export')
    @ApiOperation({ summary: 'Export RGPD « mes données » du participant courant (articles 15 et 20).' })
    public async exportMyData(@CurrentParticipantId() participantId: number) {
        return this.exportParticipantSelfData.execute(participantId);
    }
}
