// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { CreateParticipantInviteUseCase } from '@src/application/admin/participants/create-participant-invite.usecase';
import type { EraseParticipantRgpdUseCase } from '@src/application/admin/participants/erase-participant-rgpd.usecase';
import type { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import type { ListAdminParticipantsUseCase } from '@src/application/admin/participants/list-admin-participants.usecase';
import type { ListParticipantInvitationTokensUseCase } from '@src/application/admin/participants/list-participant-invitation-tokens.usecase';
import type { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant/get-participant-questionnaire-matrix.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { participantToAdminJson } from './admin.presenters';
import {
    CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
    ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
    GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
} from './admin.tokens';

@ApiTags('admin-participants')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminParticipantsController {
    public constructor(
        @Inject(LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL)
        private readonly listAdminParticipants: ListAdminParticipantsUseCase,
        @Inject(IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL)
        private readonly importParticipantsCsv: ImportParticipantsCsvUseCase,
        @Inject(CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL)
        private readonly createParticipantInvite: CreateParticipantInviteUseCase,
        @Inject(LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL)
        private readonly listParticipantInvitationTokens: ListParticipantInvitationTokensUseCase,
        @Inject(ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL)
        private readonly eraseParticipantRgpd: EraseParticipantRgpdUseCase,
        @Inject(GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL)
        private readonly getParticipantQuestionnaireMatrix: GetParticipantQuestionnaireMatrixUseCase
    ) {}

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

    @Get('participants')
    public async listParticipants(
        @Query('page') pageRaw: string,
        @Query('per_page') perPageRaw: string,
        @Query('company_id') companyIdRaw: string
    ) {
        const result = await this.listAdminParticipants.execute({
            page: AdminParticipantsController.normalizePage(pageRaw),
            perPage: AdminParticipantsController.normalizePerPage(perPageRaw),
            companyId: AdminParticipantsController.normalizePositiveInt(companyIdRaw),
        });
        return {
            ...result,
            per_page: result.perPage,
            items: result.items.map(participantToAdminJson),
        };
    }

    @Post('participants/import')
    @UseInterceptors(FileInterceptor('file'))
    public importParticipants(@UploadedFile() file: Express.Multer.File | undefined) {
        return this.importParticipantsCsv.execute(file?.buffer);
    }

    @Post('participants/:participantId/invite')
    public createInvite(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: { campaign_id?: number; questionnaire_id?: string; send_email?: boolean }
    ) {
        return this.createParticipantInvite.execute(participantId, body);
    }

    @Get('participants/:participantId/tokens')
    public listParticipantTokens(@Param('participantId', ParseIntPipe) participantId: number) {
        return this.listParticipantInvitationTokens.execute(participantId);
    }

    @Get('participants/:participantId/matrix')
    public getParticipantMatrix(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Query('qid') qidRaw: string
    ) {
        const qid = AdminParticipantsController.normalizeQid(qidRaw) ?? '';
        return this.getParticipantQuestionnaireMatrix.execute({ participantId, qid });
    }

    @Delete('participants/:participantId')
    public deleteParticipant(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: { confirm?: boolean }
    ) {
        return this.eraseParticipantRgpd.execute(participantId, body.confirm);
    }
}
