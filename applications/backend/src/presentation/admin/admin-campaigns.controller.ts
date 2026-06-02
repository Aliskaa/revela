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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';
import { ZodValidationPipe } from '@src/presentation/zod-validation.pipe';
import { transparencyScoreSnapshotToJson } from './admin.presenters';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    ACTIVATE_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    ADD_PARTICIPANT_TO_CAMPAIGN_USE_CASE_SYMBOL,
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_SYNTHESIS_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';

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

    private async ensureCampaignAccess(campaignId: number, user: JwtValidatedUser): Promise<void> {
        if (user.scope !== 'coach') {
            return;
        }
        const detail = await this.getAdminCampaignDetail.execute(campaignId, { coachId: user.coachId });
        if (!detail) {
            throw new UnauthorizedException();
        }
    }

    @Get('campaigns')
    public listCampaigns(@Req() req: { user: JwtValidatedUser }) {
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.listAdminCampaigns.execute({ coachId });
    }

    @Get('campaigns/:campaignId')
    public async getCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser }
    ) {
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.getAdminCampaignDetail.execute(campaignId, { coachId });
    }

    /**
     * Vue de synthèse (test scientifique) au niveau d'une campagne, selon son questionnaire.
     * Cf. PDF AOR section 9 — colonnes = participants, lignes = score_keys + écarts.
     * Renvoie `null` si la campagne est hors périmètre du coach (200, payload vide).
     */
    @Get('campaigns/:campaignId/synthesis-matrix')
    public async getCampaignSynthesisMatrix(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser }
    ) {
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.getAdminCampaignSynthesisMatrix.execute({ campaignId, coachId });
    }

    @Patch('campaigns/:campaignId/coach')
    public async reassignCampaignCoach(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(reassignCampaignCoachBodySchema)) body: ReassignCampaignCoachBody
    ) {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        const coachId = typeof body.coach_id === 'number' ? body.coach_id : Number(body.coach_id);
        return this.reassignAdminCampaignCoach.execute(campaignId, coachId);
    }

    @Post('campaigns')
    public createCampaign(
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(createAdminCampaignBodySchema)) body: CreateAdminCampaignBody
    ) {
        // Un coach ne peut pas créer de campagne en autonomie : c'est une responsabilité admin.
        // Cf. P06 du suivi produit 2026-05-02.
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException(
                "La création d'une campagne est réservée à l'admin. Demandez à l'admin de vous attribuer une campagne."
            );
        }
        return this.createAdminCampaign.execute(body);
    }

    @Post('campaigns/:campaignId/status')
    public async updateCampaignStatus(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(updateAdminCampaignStatusBodySchema)) body: UpdateAdminCampaignStatusBody
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        return this.updateAdminCampaignStatus.execute(campaignId, body.status ?? 'draft', {
            alignStartsAtToNow: Boolean(body.align_starts_at_to_now),
        });
    }

    @Post('campaigns/:campaignId/archive')
    public async archiveCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser }
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        return this.updateAdminCampaignStatus.execute(campaignId, 'archived');
    }

    @Post('campaigns/:campaignId/invite-company-participants')
    public async inviteCompanyParticipants(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(inviteCampaignParticipantsBodySchema)) body: InviteCampaignParticipantsBody
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        const participantIds = Array.isArray(body.participant_ids)
            ? body.participant_ids.filter((n): n is number => Number.isFinite(n))
            : undefined;
        return this.inviteCampaignParticipants.execute(campaignId, { participantIds });
    }

    @Post('campaigns/:campaignId/import-participants')
    @UseInterceptors(FileInterceptor('file'))
    public async importParticipantsForCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.importParticipantsToCampaign.execute(campaignId, file?.buffer, { coachId });
    }

    @Post('campaigns/:campaignId/participants')
    public async addParticipantToCampaignEndpoint(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body(new ZodValidationPipe(addParticipantBodySchema)) body: AddParticipantBody
    ) {
        // Ouvert à l'admin et au coach (le coach est restreint à ses campagnes via
        // `ensureCampaignAccess`). Cf. P08 du suivi produit 2026-05-02.
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        return this.addParticipantToCampaign.execute(campaignId, body, { coachId });
    }

    /**
     * Lecture du snapshot du score de transparence (P23) pour un couple campagne/participant.
     * Renvoie `null` tant que le coach/admin n'a pas activé le calcul.
     */
    @Get('campaigns/:campaignId/participants/:participantId/transparency')
    public async getCampaignParticipantTransparency(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Req() req: { user: JwtValidatedUser }
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        const snapshot = await this.getParticipantTransparencyScore.execute({ campaignId, participantId });
        return { snapshot: snapshot ? transparencyScoreSnapshotToJson(snapshot) : null };
    }

    /**
     * Active manuellement le score de transparence (P23). Réservé au coach (sur ses campagnes)
     * et à l'admin. Calcule la valeur depuis la matrice et persiste un snapshot figé.
     */
    @Post('campaigns/:campaignId/participants/:participantId/transparency/activate')
    public async activateCampaignParticipantTransparency(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Req() req: { user: JwtValidatedUser } & { ip?: string }
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        // En scope super-admin, `coachId` est `null` côté JWT : le use case résoudra vers la
        // ligne sentinelle « Admin » de `coaches` (P05).
        const actorCoachId = req.user.coachId ?? null;
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
            actorType: req.user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: req.user.coachId ?? null,
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
