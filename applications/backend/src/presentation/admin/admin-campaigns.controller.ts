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

import {
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

import type { CreateAdminCampaignUseCase } from '@src/application/admin/campaigns/create-admin-campaign.usecase';
import type { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import type { ImportParticipantsToCampaignUseCase } from '@src/application/admin/campaigns/import-participants-to-campaign.usecase';
import type { InviteCampaignParticipantsUseCase } from '@src/application/admin/campaigns/invite-campaign-participants.usecase';
import type { ListAdminCampaignsUseCase } from '@src/application/admin/campaigns/list-admin-campaigns.usecase';
import type { ReassignAdminCampaignCoachUseCase } from '@src/application/admin/campaigns/reassign-admin-campaign-coach.usecase';
import type { UpdateAdminCampaignStatusUseCase } from '@src/application/admin/campaigns/update-admin-campaign-status.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';
import type { JwtValidatedUser } from './jwt.strategy';

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
        @Inject(INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL)
        private readonly inviteCampaignParticipants: InviteCampaignParticipantsUseCase,
        @Inject(IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL)
        private readonly importParticipantsToCampaign: ImportParticipantsToCampaignUseCase,
        @Inject(LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL)
        private readonly listAdminCampaigns: ListAdminCampaignsUseCase
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

    @Patch('campaigns/:campaignId/coach')
    public async reassignCampaignCoach(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body() body: { coach_id?: number }
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
        @Body()
        body: {
            coach_id?: number;
            company_id?: number;
            name?: string;
            questionnaire_id?: string;
            starts_at?: string | null;
            ends_at?: string | null;
            allow_test_without_manual_inputs?: boolean;
            status?: 'draft' | 'active' | 'closed' | 'archived';
        }
    ) {
        if (req.user.scope === 'coach') {
            body.coach_id = req.user.coachId;
        }
        return this.createAdminCampaign.execute(body);
    }

    @Post('campaigns/:campaignId/status')
    public async updateCampaignStatus(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body() body: { status?: 'draft' | 'active' | 'closed' | 'archived'; align_starts_at_to_now?: boolean }
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
        @Req() req: { user: JwtValidatedUser }
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        return this.inviteCampaignParticipants.execute(campaignId);
    }

    @Post('campaigns/:campaignId/import-participants')
    @UseInterceptors(FileInterceptor('file'))
    public async importParticipantsForCampaign(
        @Param('campaignId', ParseIntPipe) campaignId: number,
        @Req() req: { user: JwtValidatedUser },
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        await this.ensureCampaignAccess(campaignId, req.user);
        return this.importParticipantsToCampaign.execute(campaignId, file?.buffer);
    }
}
