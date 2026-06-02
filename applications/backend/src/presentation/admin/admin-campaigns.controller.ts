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
    Req,
    UnauthorizedException,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
    type AddParticipantBody,
    type CreateAdminCampaignBody,
    type InviteCampaignParticipantsBody,
    type ReassignCampaignCoachBody,
    type UpdateAdminCampaignStatusBody,
    addParticipantBodySchema,
    createAdminCampaignBodySchema,
    inviteCampaignParticipantsBodySchema,
    reassignCampaignCoachBodySchema,
    updateAdminCampaignStatusBodySchema,
} from '@aor/types';

import type { AddParticipantToCampaignUseCase } from '@src/application/admin/campaigns/add-participant-to-campaign.usecase';
import type { CreateAdminCampaignUseCase } from '@src/application/admin/campaigns/create-admin-campaign.usecase';
import type { GetAdminCampaignParticipantMatrixUseCase } from '@src/application/admin/campaigns/get-admin-campaign-participant-matrix.usecase';
import type { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import type { GetAdminCampaignSynthesisMatrixUseCase } from '@src/application/admin/campaigns/get-admin-campaign-synthesis-matrix.usecase';
import type { ImportParticipantsToCampaignUseCase } from '@src/application/admin/campaigns/import-participants-to-campaign.usecase';
import type { InviteCampaignParticipantsUseCase } from '@src/application/admin/campaigns/invite-campaign-participants.usecase';
import type { ListAdminCampaignsUseCase } from '@src/application/admin/campaigns/list-admin-campaigns.usecase';
import type { ReassignAdminCampaignCoachUseCase } from '@src/application/admin/campaigns/reassign-admin-campaign-coach.usecase';
import type { UpdateAdminCampaignStatusUseCase } from '@src/application/admin/campaigns/update-admin-campaign-status.usecase';
import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import {
    type ActivateParticipantTransparencyScoreUseCase,
    TransparencyScoreNotComputableError,
} from '@src/application/transparency/activate-participant-transparency-score.usecase';
import type { GetParticipantTransparencyScoreUseCase } from '@src/application/transparency/get-participant-transparency-score.usecase';
import { CurrentCoachScope } from '@src/presentation/current-coach-scope.decorator';
import { CurrentUser } from '@src/presentation/current-user.decorator';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';
import { transparencyScoreSnapshotToJson } from '@src/presentation/transparency-snapshot.presenter';
import { ZodValidationPipe } from '@src/presentation/zod-validation.pipe';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    ACTIVATE_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    ADD_PARTICIPANT_TO_CAMPAIGN_USE_CASE_SYMBOL,
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_PARTICIPANT_MATRIX_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_SYNTHESIS_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';
import { CampaignAccessGuard } from './campaign-access.guard';

@ApiTags('admin-campaigns')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminCampaignsController {
    public constructor(
        @Inject(CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL)
        private readonly createAdminCampaign: CreateAdminCampaignUseCase,
        @Inject(UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL)
        private readonly updateAdminCampaignStatus: UpdateAdminCampaignStatusUseCase,
        @Inject(REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL)
        private readonly reassignAdminCampaignCoach: ReassignAdminCampaignCoachUseCase,
        @Inject(GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCampaignDetail: GetAdminCampaignDetailUseCase,
        @Inject(GET_ADMIN_CAMPAIGN_SYNTHESIS_MATRIX_USE_CASE_SYMBOL)
        private readonly getAdminCampaignSynthesisMatrix: GetAdminCampaignSynthesisMatrixUseCase,
        @Inject(GET_ADMIN_CAMPAIGN_PARTICIPANT_MATRIX_USE_CASE_SYMBOL)
        private readonly getAdminCampaignParticipantMatrix: GetAdminCampaignParticipantMatrixUseCase,
        @Inject(INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL)
        private readonly inviteCampaignParticipants: InviteCampaignParticipantsUseCase,
        @Inject(IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL)
        private readonly importParticipantsToCampaign: ImportParticipantsToCampaignUseCase,
        @Inject(LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL)
        private readonly listAdminCampaigns: ListAdminCampaignsUseCase,
        @Inject(ADD_PARTICIPANT_TO_CAMPAIGN_USE_CASE_SYMBOL)
        private readonly addParticipantToCampaign: AddParticipantToCampaignUseCase,
        @Inject(ACTIVATE_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL)
        private readonly activateParticipantTransparencyScore: ActivateParticipantTransparencyScoreUseCase,
        @Inject(GET_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL)
        private readonly getParticipantTransparencyScore: GetParticipantTransparencyScoreUseCase,
        private readonly audit: AuditLoggerService
    ) {}

    @Get('campaigns')
    @ApiOperation({ summary: 'Liste les campagnes visibles par l’utilisateur courant.' })
    public listCampaigns(@CurrentCoachScope() coachId: number | undefined) {
        return this.listAdminCampaigns.execute({ coachId });
    }

    @Get('campaigns/:campaignId')
    @ApiOperation({ summary: 'Détail d’une campagne par son identifiant.' })
    public async getCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @CurrentCoachScope() coachId: number | undefined
    ) {
        return this.getAdminCampaignDetail.execute(campaignId, { coachId });
    }

    /**
     * Vue de synthèse (test scientifique) au niveau d'une campagne, selon son questionnaire.
     * Cf. PDF AOR section 9 — colonnes = participants, lignes = score_keys + écarts.
     * Renvoie `null` si la campagne est hors périmètre du coach (200, payload vide).
     */
    @Get('campaigns/:campaignId/synthesis-matrix')
    @ApiOperation({ summary: 'Vue de synthèse (test scientifique) d’une campagne selon son questionnaire.' })
    public async getCampaignSynthesisMatrix(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @CurrentCoachScope() coachId: number | undefined
    ) {
        return this.getAdminCampaignSynthesisMatrix.execute({ campaignId, coachId });
    }

    @Patch('campaigns/:campaignId/coach')
    @ApiOperation({ summary: 'Réassigne le coach d’une campagne (réservé à l’admin).' })
    public async reassignCampaignCoach(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @CurrentUser() user: JwtValidatedUser,
        @Body(new ZodValidationPipe(reassignCampaignCoachBodySchema)) body: ReassignCampaignCoachBody
    ) {
        if (user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        const coachId = typeof body.coach_id === 'number' ? body.coach_id : Number(body.coach_id);
        return this.reassignAdminCampaignCoach.execute(campaignId, coachId);
    }

    @Post('campaigns')
    @ApiOperation({ summary: 'Crée une campagne (réservé à l’admin).' })
    public createCampaign(
        @CurrentUser() user: JwtValidatedUser,
        @Body(new ZodValidationPipe(createAdminCampaignBodySchema)) body: CreateAdminCampaignBody
    ) {
        // Un coach ne peut pas créer de campagne en autonomie : c'est une responsabilité admin.
        // Cf. P06 du suivi produit 2026-05-02.
        if (user.scope === 'coach') {
            throw new UnauthorizedException(
                "La création d'une campagne est réservée à l'admin. Demandez à l'admin de vous attribuer une campagne."
            );
        }
        return this.createAdminCampaign.execute(body);
    }

    // Transition d'état → `PATCH` (ADR-010 R5). L'archivage n'est pas un endpoint dédié :
    // c'est `PATCH /status` avec `{ status: 'archived' }` (ex-`POST /archive` supprimé).
    @Patch('campaigns/:campaignId/status')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Met à jour le statut d’une campagne (archivage inclus via { status: archived }).' })
    public async updateCampaignStatus(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Body(new ZodValidationPipe(updateAdminCampaignStatusBodySchema)) body: UpdateAdminCampaignStatusBody
    ) {
        return this.updateAdminCampaignStatus.execute(campaignId, body.status ?? 'draft', {
            alignStartsAtToNow: Boolean(body.align_starts_at_to_now),
        });
    }

    // Créer des invitations = `POST` sur la sous-collection `invitations` (ADR-010 R5),
    // pas un verbe métier dans l'URL (ex-`/invite-company-participants`).
    @Post('campaigns/:campaignId/invitations')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Invite des participants de l’entreprise rattachée à la campagne.' })
    public async inviteCompanyParticipants(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Body(new ZodValidationPipe(inviteCampaignParticipantsBodySchema)) body: InviteCampaignParticipantsBody
    ) {
        const participantIds = Array.isArray(body.participant_ids)
            ? body.participant_ids.filter((n): n is number => Number.isFinite(n))
            : undefined;
        return this.inviteCampaignParticipants.execute(campaignId, { participantIds });
    }

    // Import sous la sous-collection `participants` (ADR-010 R5/R6 — aligné sur
    // `companies/:id/participants/import`), ex-`/import-participants`.
    @Post('campaigns/:campaignId/participants/import')
    @UseGuards(CampaignAccessGuard)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Importe des participants dans une campagne via un fichier CSV.' })
    public async importParticipantsForCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @CurrentCoachScope() coachId: number | undefined,
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        return this.importParticipantsToCampaign.execute(campaignId, file?.buffer, { coachId });
    }

    @Post('campaigns/:campaignId/participants')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Ajoute un participant à une campagne (admin ou coach habilité).' })
    public async addParticipant(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @CurrentCoachScope() coachId: number | undefined,
        @Body(new ZodValidationPipe(addParticipantBodySchema)) body: AddParticipantBody
    ) {
        // Ouvert à l'admin et au coach (le coach est restreint à ses campagnes via
        // `CampaignAccessGuard`). Cf. P08 du suivi produit 2026-05-02.
        return this.addParticipantToCampaign.execute(campaignId, body, { coachId });
    }

    /**
     * Matrice des réponses d'un participant **dans le contexte d'une campagne** (axe participation,
     * ADR-010 R3). Le `qid` n'est pas lu en query : il est dérivé de la campagne par le use case.
     * Le déplacement sur l'axe participation corrige le bug latent de l'ex-route
     * `/admin/participants/:pid/matrix?qid=` qui agrégeait toutes campagnes confondues.
     */
    @Get('campaigns/:campaignId/participants/:participantId/matrix')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Matrice des réponses d’un participant pour une campagne (questionnaire dérivé).' })
    public getCampaignParticipantMatrix(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @CurrentCoachScope() coachId: number | undefined
    ) {
        return this.getAdminCampaignParticipantMatrix.execute({ campaignId, participantId, coachId });
    }

    /**
     * Lecture du snapshot du score de transparence (P23) pour un couple campagne/participant.
     * Renvoie `null` tant que le coach/admin n'a pas activé le calcul.
     */
    @Get('campaigns/:campaignId/participants/:participantId/transparency')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Lit le snapshot du score de transparence (P23) d’un couple campagne/participant.' })
    public async getCampaignParticipantTransparency(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number
    ) {
        const snapshot = await this.getParticipantTransparencyScore.execute({ campaignId, participantId });
        return { snapshot: snapshot ? transparencyScoreSnapshotToJson(snapshot) : null };
    }

    /**
     * Active manuellement le score de transparence (P23). Réservé au coach (sur ses campagnes)
     * et à l'admin. Calcule la valeur depuis la matrice et persiste un snapshot figé.
     */
    @Post('campaigns/:campaignId/participants/:participantId/transparency/activate')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Active le calcul du score de transparence (P23) pour un couple campagne/participant.' })
    public async activateCampaignParticipantTransparency(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @CurrentUser() user: JwtValidatedUser,
        @CurrentCoachScope() coachId: number | undefined,
        @Req() req: { ip?: string }
    ) {
        // En scope super-admin, `coachId` est `null` côté JWT : le use case résoudra vers la
        // ligne sentinelle « Admin » de `coaches` (P05).
        const actorCoachId = user.coachId ?? null;
        let snapshot: Awaited<ReturnType<ActivateParticipantTransparencyScoreUseCase['execute']>>;
        try {
            snapshot = await this.activateParticipantTransparencyScore.execute({
                campaignId,
                participantId,
                coachId,
                actorCoachId,
            });
        } catch (err) {
            if (err instanceof TransparencyScoreNotComputableError) {
                throw new BadRequestException(err.message);
            }
            throw err;
        }
        void this.audit.record({
            actorType: user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: user.coachId ?? null,
            action: 'admin.transparency.activate',
            resourceType: 'participant',
            resourceId: participantId,
            payload: {
                campaign_id: campaignId,
                value: snapshot.value,
                peer_count: snapshot.peerCount,
            },
            ipAddress: req.ip ?? null,
        });
        return { snapshot: transparencyScoreSnapshotToJson(snapshot) };
    }
}
