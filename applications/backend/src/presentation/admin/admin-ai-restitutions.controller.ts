// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { harnessInputSchema } from '@aor/ai-harness';
import { type AiRestitutionAdminEnvelope, type AiRestitutionAdminView, editAiRestitutionBodySchema } from '@aor/types';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import type { ApproveAiRestitutionUseCase } from '@src/application/ai-restitutions/approve-ai-restitution.usecase';
import type { EditAiRestitutionUseCase } from '@src/application/ai-restitutions/edit-ai-restitution.usecase';
import type { GenerateAiRestitutionUseCase } from '@src/application/ai-restitutions/generate-ai-restitution.usecase';
import type { GetAdminAiRestitutionUseCase } from '@src/application/ai-restitutions/get-admin-ai-restitution.usecase';
import type { RejectAiRestitutionUseCase } from '@src/application/ai-restitutions/reject-ai-restitution.usecase';
import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import type { AiRestitutionRecord } from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminAiRestitutionsExceptionFilter } from './admin-ai-restitutions-exception.filter';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    APPROVE_AI_RESTITUTION_USE_CASE_SYMBOL,
    EDIT_AI_RESTITUTION_USE_CASE_SYMBOL,
    GENERATE_AI_RESTITUTION_USE_CASE_SYMBOL,
    GET_ADMIN_AI_RESTITUTION_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    REJECT_AI_RESTITUTION_USE_CASE_SYMBOL,
} from './admin.tokens';

const recordToAdminView = (r: AiRestitutionRecord): AiRestitutionAdminView => {
    const intermediate = r.intermediateJson as
        | { selected_dimensions?: ReadonlyArray<{ name: string; reason: string; gap: number }> }
        | undefined;
    const selected = intermediate?.selected_dimensions ?? [];
    return {
        id: r.id,
        campaign_id: r.campaignId,
        participant_id: r.participantId,
        status: r.status,
        model: r.model,
        prompt_version: r.promptVersion,
        selected_dimensions: selected.map(d => ({
            name: d.name as 'inclusion' | 'control' | 'openness',
            reason: d.reason as 'ecart_exprime_desire' | 'ecart_auto_feedback',
            gap: d.gap,
        })),
        raw_output: r.rawOutput,
        edited_output: r.editedOutput,
        validation_report: r.validationReport,
        regen_attempts: r.regenAttempts,
        generated_at: r.generatedAt.toISOString(),
        approved_at: r.approvedAt ? r.approvedAt.toISOString() : null,
        approved_by_coach_id: r.approvedByCoachId,
        updated_at: r.updatedAt.toISOString(),
    };
};

@ApiTags('admin-ai-restitutions')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, AdminAiRestitutionsExceptionFilter)
export class AdminAiRestitutionsController {
    public constructor(
        @Inject(GENERATE_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly generateRestitution: GenerateAiRestitutionUseCase,
        @Inject(EDIT_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly editRestitution: EditAiRestitutionUseCase,
        @Inject(APPROVE_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly approveRestitution: ApproveAiRestitutionUseCase,
        @Inject(REJECT_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly rejectRestitution: RejectAiRestitutionUseCase,
        @Inject(GET_ADMIN_AI_RESTITUTION_USE_CASE_SYMBOL)
        private readonly getAdminRestitution: GetAdminAiRestitutionUseCase,
        @Inject(GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCampaignDetail: GetAdminCampaignDetailUseCase,
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

    @Get('campaigns/:campaignId/participants/:participantId/restitution')
    public async getRestitution(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Req() req: { user: JwtValidatedUser }
    ): Promise<AiRestitutionAdminEnvelope> {
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const record = await this.getAdminRestitution.execute({
            campaignId,
            participantId,
            coachId,
        });
        return { restitution: record ? recordToAdminView(record) : null };
    }

    @Post('campaigns/:campaignId/participants/:participantId/restitution/generate')
    public async generate(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: unknown,
        @Req() req: { user: JwtValidatedUser } & { ip?: string }
    ): Promise<AiRestitutionAdminEnvelope> {
        await this.ensureCampaignAccess(campaignId, req.user);
        const parsed = harnessInputSchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(
                'Corps de requête invalide pour la génération de la restitution (cf. schéma §5 PDF).'
            );
        }
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const record = await this.generateRestitution.execute({
            campaignId,
            participantId,
            coachId,
            harnessInput: parsed.data,
        });
        void this.audit.record({
            actorType: req.user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: req.user.coachId ?? null,
            action: 'admin.ai_restitution.generate',
            resourceType: 'participant',
            resourceId: participantId,
            payload: {
                campaign_id: campaignId,
                status: record.status,
                model: record.model,
                prompt_version: record.promptVersion,
                validation_ok: record.validationReport?.ok ?? null,
            },
            ipAddress: req.ip ?? null,
        });
        return { restitution: recordToAdminView(record) };
    }

    @Put('campaigns/:campaignId/participants/:participantId/restitution')
    public async edit(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: unknown,
        @Req() req: { user: JwtValidatedUser }
    ): Promise<AiRestitutionAdminEnvelope> {
        await this.ensureCampaignAccess(campaignId, req.user);
        const parsed = editAiRestitutionBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException("Corps de requête invalide pour l'édition de la restitution.");
        }
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const record = await this.editRestitution.execute({
            campaignId,
            participantId,
            coachId,
            editedOutput: parsed.data.edited_output,
        });
        return { restitution: recordToAdminView(record) };
    }

    @Post('campaigns/:campaignId/participants/:participantId/restitution/approve')
    public async approve(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Req() req: { user: JwtValidatedUser } & { ip?: string }
    ): Promise<AiRestitutionAdminEnvelope> {
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const actorCoachId = req.user.coachId ?? null;
        const record = await this.approveRestitution.execute({
            campaignId,
            participantId,
            coachId,
            actorCoachId,
        });
        void this.audit.record({
            actorType: req.user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: req.user.coachId ?? null,
            action: 'admin.ai_restitution.approve',
            resourceType: 'participant',
            resourceId: participantId,
            payload: {
                campaign_id: campaignId,
                approved_by_coach_id: record.approvedByCoachId,
            },
            ipAddress: req.ip ?? null,
        });
        return { restitution: recordToAdminView(record) };
    }

    @Post('campaigns/:campaignId/participants/:participantId/restitution/reject')
    public async reject(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Req() req: { user: JwtValidatedUser } & { ip?: string }
    ): Promise<AiRestitutionAdminEnvelope> {
        await this.ensureCampaignAccess(campaignId, req.user);
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const record = await this.rejectRestitution.execute({
            campaignId,
            participantId,
            coachId,
        });
        void this.audit.record({
            actorType: req.user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: req.user.coachId ?? null,
            action: 'admin.ai_restitution.reject',
            resourceType: 'participant',
            resourceId: participantId,
            payload: { campaign_id: campaignId },
            ipAddress: req.ip ?? null,
        });
        return { restitution: recordToAdminView(record) };
    }
}
