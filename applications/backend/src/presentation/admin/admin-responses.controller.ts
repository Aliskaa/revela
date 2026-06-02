// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseIntPipe,
    Query,
    Res,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type { DeleteAdminResponseUseCase } from '@src/application/admin/responses/delete-admin-response.usecase';
import type { ExportAdminAnonymizedResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-anonymized-responses-csv.usecase';
import type { ExportAdminResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-responses-csv.usecase';
import type { ListAdminResponsesUseCase } from '@src/application/admin/responses/list-admin-responses.usecase';
import type { GetPublicResponseUseCase } from '@src/application/responses/get-public-response.usecase';
import { CurrentCoachScope } from '@src/presentation/current-coach-scope.decorator';
import { type PaginationParams, PaginationQueryPipe } from '@src/presentation/pagination-query.pipe';
import { normalizePositiveInt, normalizeQid } from '@src/presentation/query-normalizers';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';
import { GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL } from '@src/presentation/responses/responses.tokens';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import {
    DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL,
    EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL,
    EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL,
} from './admin.tokens';
import { CampaignAccessGuard } from './campaign-access.guard';

@ApiTags('admin-responses')
@ApiBearerAuth('jwt')
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
        private readonly exportAdminAnonymizedResponsesCsv: ExportAdminAnonymizedResponsesCsvUseCase
    ) {}

    @Get('responses')
    @UseGuards(CampaignAccessGuard)
    @ApiOperation({ summary: 'Liste paginée des réponses, filtrable par questionnaire et campagne.' })
    public async listResponses(
        @CurrentCoachScope() coachId: number | undefined,
        @Query('qid') qidRaw: string,
        @Query('campaign_id') campaignIdRaw: string,
        @Query(PaginationQueryPipe) { page, perPage }: PaginationParams
    ) {
        const qid = normalizeQid(qidRaw);
        const campaignId = normalizePositiveInt(campaignIdRaw);
        const result = await this.listAdminResponses.execute({ qid, campaignId, coachId, page, perPage });
        return {
            ...result,
            per_page: result.perPage,
        };
    }

    @Get('responses/:responseId')
    @ApiOperation({ summary: 'Détail d’une réponse par son identifiant.' })
    public getResponse(
        @Param('responseId', ParseIntPipe) responseId: number,
        @CurrentCoachScope() coachId: number | undefined
    ) {
        return this.getPublicResponse.execute(responseId, { coachId });
    }

    @Delete('responses/:responseId')
    // Famille « suppression avec résumé » → 200 + corps, déclaré explicitement
    // (ADR-009 §5 : choix conscient et cohérent par famille).
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Supprime une réponse et renvoie un résumé de la suppression.' })
    public deleteResponse(
        @Param('responseId', ParseIntPipe) responseId: number,
        @Body() body: { confirm?: boolean },
        @CurrentCoachScope() coachId: number | undefined
    ) {
        return this.deleteAdminResponse.execute(responseId, body.confirm, { coachId });
    }

    @Get('export/responses')
    @ApiOperation({ summary: 'Exporte les réponses d’un questionnaire au format CSV.' })
    public async exportResponses(@Query('qid') qidRaw: string, @Res() res: Response): Promise<void> {
        const qid = normalizeQid(qidRaw) ?? '';
        const { body, filename } = await this.exportAdminResponsesCsv.execute(qid);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(body);
    }

    @Get('export/responses/anonymized')
    @ApiOperation({ summary: 'Exporte les réponses anonymisées d’un questionnaire au format CSV.' })
    public async exportAnonymized(
        @Query('qid') qidRaw: string,
        @Query('company_id') companyIdRaw: string,
        @Res() res: Response
    ): Promise<void> {
        const qid = normalizeQid(qidRaw) ?? '';
        const companyId = normalizePositiveInt(companyIdRaw);
        const { body, filename } = await this.exportAdminAnonymizedResponsesCsv.execute(qid, companyId ?? Number.NaN);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(body);
    }
}
