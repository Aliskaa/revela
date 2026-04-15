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

import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Query, Req, Res, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import type { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import type { DeleteAdminResponseUseCase } from '@src/application/admin/responses/delete-admin-response.usecase';
import type { ExportAdminAnonymizedResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-anonymized-responses-csv.usecase';
import type { ExportAdminResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-responses-csv.usecase';
import type { ListAdminResponsesUseCase } from '@src/application/admin/responses/list-admin-responses.usecase';
import type { GetPublicResponseUseCase } from '@src/application/responses/get-public-response.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';
import { GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL } from '@src/presentation/responses/responses.tokens';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL,
    EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL,
    EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL,
} from './admin.tokens';
import type { JwtValidatedUser } from './jwt.strategy';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminResponsesController {
    public constructor(
        @Inject(LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL)
        private readonly listAdminResponses: ListAdminResponsesUseCase,
        @Inject(GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL)
        private readonly getPublicResponse: GetPublicResponseUseCase,
        @Inject(DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL)
        private readonly deleteAdminResponse: DeleteAdminResponseUseCase,
        @Inject(EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL)
        private readonly exportAdminResponsesCsv: ExportAdminResponsesCsvUseCase,
        @Inject(EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL)
        private readonly exportAdminAnonymizedResponsesCsv: ExportAdminAnonymizedResponsesCsvUseCase,
        @Inject(GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCampaignDetail: GetAdminCampaignDetailUseCase
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

    private static normalizeQid(raw?: string): string | undefined {
        const qid = (raw ?? '').trim().toUpperCase();
        return qid.length > 0 ? qid : undefined;
    }

    private static normalizePositiveInt(raw?: string): number | undefined {
        if (raw === undefined || raw.trim() === '') {
            return undefined;
        }
        const value = Number(raw);
        return Number.isFinite(value) && value > 0 ? value : undefined;
    }

    private static normalizePage(raw?: string): number {
        const value = Number(raw ?? 1);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
    }

    private static normalizePerPage(raw?: string): number {
        const value = Number(raw ?? 50);
        const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 50;
        return Math.min(safe, 200);
    }

    @Get('responses')
    public async listResponses(
        @Req() req: { user: JwtValidatedUser },
        @Query('qid') qidRaw: string,
        @Query('campaign_id') campaignIdRaw: string,
        @Query('page') pageRaw: string,
        @Query('per_page') perPageRaw: string
    ) {
        const qid = AdminResponsesController.normalizeQid(qidRaw);
        const campaignId = AdminResponsesController.normalizePositiveInt(campaignIdRaw);
        const page = AdminResponsesController.normalizePage(pageRaw);
        const perPage = AdminResponsesController.normalizePerPage(perPageRaw);
        if (campaignId !== undefined) {
            await this.ensureCampaignAccess(campaignId, req.user);
        }
        const result = await this.listAdminResponses.execute({ qid, campaignId, page, perPage });
        return {
            ...result,
            per_page: result.perPage,
        };
    }

    @Get('responses/:responseId')
    public getResponse(@Param('responseId', ParseIntPipe) responseId: number) {
        return this.getPublicResponse.execute(responseId);
    }

    @Delete('responses/:responseId')
    public deleteResponse(@Param('responseId', ParseIntPipe) responseId: number, @Body() body: { confirm?: boolean }) {
        return this.deleteAdminResponse.execute(responseId, body.confirm);
    }

    @Get('export/responses')
    public async exportResponses(@Query('qid') qidRaw: string, @Res() res: Response): Promise<void> {
        const qid = AdminResponsesController.normalizeQid(qidRaw) ?? '';
        const { body, filename } = await this.exportAdminResponsesCsv.execute(qid);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(body);
    }

    @Get('export/responses/anonymized')
    public async exportAnonymized(
        @Query('qid') qidRaw: string,
        @Query('company_id') companyIdRaw: string,
        @Res() res: Response
    ): Promise<void> {
        const qid = AdminResponsesController.normalizeQid(qidRaw) ?? '';
        const companyId = AdminResponsesController.normalizePositiveInt(companyIdRaw);
        const { body, filename } = await this.exportAdminAnonymizedResponsesCsv.execute(qid, companyId ?? Number.NaN);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(body);
    }
}
