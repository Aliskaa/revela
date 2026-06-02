// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UploadedFile,
    UseFilters,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
// `Req` est conservé : il sert encore à récupérer `req.ip` (concern transport pur) sur
// les handlers d'audit, le `req.user` étant lui exposé via `@CurrentUser()`.
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import type { CreateParticipantInviteUseCase } from '@src/application/admin/participants/create-participant-invite.usecase';
import type { EraseParticipantRgpdUseCase } from '@src/application/admin/participants/erase-participant-rgpd.usecase';
import type { GetAdminParticipantAvatarUseCase } from '@src/application/admin/participants/get-admin-participant-avatar.usecase';
import type { GetAdminParticipantDetailUseCase } from '@src/application/admin/participants/get-admin-participant-detail.usecase';
import type { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import type { ListAdminParticipantsUseCase } from '@src/application/admin/participants/list-admin-participants.usecase';
import type { ListParticipantInvitationTokensUseCase } from '@src/application/admin/participants/list-participant-invitation-tokens.usecase';
import type {
    UpdateAdminParticipantUseCase,
    UpdateParticipantProfileBody,
} from '@src/application/admin/participants/update-admin-participant.usecase';
import type { UploadAdminParticipantAvatarUseCase } from '@src/application/admin/participants/upload-admin-participant-avatar.usecase';
import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import type { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { sendAvatarResponse } from '@src/presentation/avatar-response';
import { CurrentCoachScope } from '@src/presentation/current-coach-scope.decorator';
import { CurrentUser } from '@src/presentation/current-user.decorator';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { type PaginationParams, PaginationQueryPipe } from '@src/presentation/pagination-query.pipe';
import { ParticipantAvatarExceptionFilter } from '@src/presentation/participant-session/participant-avatar-exception.filter';
import { GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL } from '@src/presentation/participant-session/participant.tokens';
import { normalizePositiveInt, normalizeQid } from '@src/presentation/query-normalizers';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { participantDetailToAdminJson, participantToAdminJson } from './admin.presenters';

import {
    CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
    ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
    GET_ADMIN_PARTICIPANT_AVATAR_USE_CASE_SYMBOL,
    GET_ADMIN_PARTICIPANT_DETAIL_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
    UPDATE_ADMIN_PARTICIPANT_USE_CASE_SYMBOL,
    UPLOAD_ADMIN_PARTICIPANT_AVATAR_USE_CASE_SYMBOL,
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
        @Inject(GET_ADMIN_PARTICIPANT_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminParticipantDetail: GetAdminParticipantDetailUseCase,
        @Inject(GET_ADMIN_PARTICIPANT_AVATAR_USE_CASE_SYMBOL)
        private readonly getAdminParticipantAvatar: GetAdminParticipantAvatarUseCase,
        @Inject(UPLOAD_ADMIN_PARTICIPANT_AVATAR_USE_CASE_SYMBOL)
        private readonly uploadAdminParticipantAvatar: UploadAdminParticipantAvatarUseCase,
        @Inject(UPDATE_ADMIN_PARTICIPANT_USE_CASE_SYMBOL)
        private readonly updateAdminParticipant: UpdateAdminParticipantUseCase,
        @Inject(GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL)
        private readonly getParticipantQuestionnaireMatrix: GetParticipantQuestionnaireMatrixUseCase,
        private readonly audit: AuditLoggerService
    ) {}

    private static normalizeSearch(raw?: string): string | undefined {
        const trimmed = (raw ?? '').trim();
        if (trimmed.length === 0) {
            return undefined;
        }
        // Limite défensive : aucun usage légitime au-delà ; protège la requête SQL
        // d'un pattern ILIKE pathologique.
        return trimmed.slice(0, 100);
    }

    @Get('participants')
    @ApiOperation({ summary: 'Liste paginée des participants, filtrable par entreprise et recherche.' })
    public async listParticipants(
        @CurrentCoachScope() coachId: number | undefined,
        @Query(PaginationQueryPipe) { page, perPage }: PaginationParams,
        @Query('company_id') companyIdRaw: string,
        @Query('q') qRaw: string
    ) {
        const result = await this.listAdminParticipants.execute({
            page,
            perPage,
            companyId: normalizePositiveInt(companyIdRaw),
            coachId,
            search: AdminParticipantsController.normalizeSearch(qRaw),
        });
        return {
            ...result,
            per_page: result.perPage,
            items: result.items.map(participantToAdminJson),
        };
    }

    @Get('participants/:participantId')
    @ApiOperation({ summary: 'Détail d’un participant par son identifiant.' })
    public async getParticipant(
        @CurrentCoachScope() coachId: number | undefined,
        @Param('participantId', ParseIntPipe) participantId: number
    ) {
        const detail = await this.getAdminParticipantDetail.execute(participantId, { coachId });
        if (!detail) {
            throw new NotFoundException();
        }
        return participantDetailToAdminJson(detail);
    }

    @Get('participants/:participantId/avatar')
    @UseFilters(ParticipantAvatarExceptionFilter)
    @ApiOperation({ summary: 'Récupère l’avatar d’un participant.' })
    public async getParticipantAvatar(
        @CurrentCoachScope() coachId: number | undefined,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Res() res: Response
    ) {
        const avatar = await this.getAdminParticipantAvatar.execute(participantId, { coachId });
        sendAvatarResponse(res, avatar);
    }

    @Post('participants/:participantId/avatar')
    @UseInterceptors(FileInterceptor('file'))
    @UseFilters(ParticipantAvatarExceptionFilter)
    @ApiOperation({ summary: 'Met à jour l’avatar d’un participant.' })
    public async uploadParticipantAvatar(
        @CurrentCoachScope() coachId: number | undefined,
        @Param('participantId', ParseIntPipe) participantId: number,
        @UploadedFile() file: Express.Multer.File | undefined
    ) {
        return this.uploadAdminParticipantAvatar.execute(participantId, file, { coachId });
    }

    @Patch('participants/:participantId')
    @ApiOperation({ summary: 'Met à jour le profil d’un participant.' })
    public async updateParticipant(
        @CurrentUser() user: JwtValidatedUser,
        @CurrentCoachScope() coachId: number | undefined,
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: UpdateParticipantProfileBody,
        @Req() req: { ip?: string }
    ) {
        const detail = await this.updateAdminParticipant.execute(participantId, body, { coachId });

        void this.audit.record({
            actorType: user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: user.coachId ?? null,
            action: 'admin.participant.update',
            resourceType: 'participant',
            resourceId: participantId,
            // On enregistre les CHAMPS modifiés, pas leurs valeurs (PII).
            payload: { fields: Object.keys(body) },
            ipAddress: req.ip ?? null,
        });

        return participantDetailToAdminJson(detail);
    }

    @Post('participants/import')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Importe des participants via un fichier CSV.' })
    public importParticipants(@UploadedFile() file: Express.Multer.File | undefined) {
        return this.importParticipantsCsv.execute(file?.buffer);
    }

    @Post('participants/:participantId/invite')
    @ApiOperation({ summary: 'Crée une invitation pour un participant.' })
    public createInvite(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: { campaign_id?: number; questionnaire_id?: string; send_email?: boolean }
    ) {
        return this.createParticipantInvite.execute(participantId, body);
    }

    @Get('participants/:participantId/tokens')
    @ApiOperation({ summary: 'Liste les tokens d’invitation d’un participant.' })
    public listParticipantTokens(@Param('participantId', ParseIntPipe) participantId: number) {
        return this.listParticipantInvitationTokens.execute(participantId);
    }

    @Get('participants/:participantId/matrix')
    @ApiOperation({ summary: 'Matrice des réponses d’un participant pour un questionnaire.' })
    public getParticipantMatrix(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Query('qid') qidRaw: string,
        @CurrentCoachScope() coachId: number | undefined
    ) {
        const qid = normalizeQid(qidRaw) ?? '';
        return this.getParticipantQuestionnaireMatrix.execute({
            participantId,
            qid,
            coachId,
            peerColumnPerspective: 'received',
            anonymizeReceivedPeerLabels: false,
        });
    }

    @Delete('participants/:participantId')
    // Famille « suppression avec résumé » (RGPD erase) → 200 + corps, déclaré
    // explicitement (ADR-009 §5 : choix conscient et cohérent par famille).
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Efface un participant (RGPD) et renvoie un résumé de la suppression.' })
    public async deleteParticipant(
        @Param('participantId', ParseIntPipe) participantId: number,
        @Body() body: { confirm?: boolean },
        @CurrentUser() user: JwtValidatedUser,
        @CurrentCoachScope() coachId: number | undefined,
        @Req() req: { ip?: string }
    ) {
        const summary = await this.eraseParticipantRgpd.execute(participantId, body.confirm, { coachId });

        void this.audit.record({
            actorType: user.scope === 'super-admin' ? 'super-admin' : 'coach',
            actorId: user.coachId ?? null,
            action: 'admin.participant.erase',
            resourceType: 'participant',
            resourceId: participantId,
            payload: {
                responses_removed: summary.responses_removed,
                invite_tokens_removed: summary.invite_tokens_removed,
            },
            ipAddress: req.ip ?? null,
        });

        return summary;
    }
}
