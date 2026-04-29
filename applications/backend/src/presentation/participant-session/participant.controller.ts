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
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { updateParticipantProfileBodySchema } from '@aor/types';
import type { ConfirmCampaignParticipationUseCase } from '@src/application/participant-session/confirm-campaign-participation.usecase';
import type { GetParticipantSessionQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-session-questionnaire-matrix.usecase';
import type { GetParticipantSessionUseCase } from '@src/application/participant-session/get-participant-session.usecase';
import type { ListParticipantCampaignPeersUseCase } from '@src/application/participant-session/list-participant-campaign-peers.usecase';
import type { ParticipantLoginUseCase } from '@src/application/participant-session/participant-login.usecase';
import type { GetParticipantOwnedResponseUseCase } from '@src/application/responses/get-participant-owned-response.usecase';
import type { SubmitParticipantQuestionnaireUseCase } from '@src/application/responses/submit-participant-questionnaire.usecase';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import { PARTICIPANTS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { JwtValidatedUser } from '@src/presentation/admin/jwt.strategy';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { ParticipantAuthExceptionFilter } from './participant-auth-exception.filter';
import { ParticipantJwtAuthGuard } from './participant-jwt-auth.guard';
import { ParticipantSessionExceptionFilter } from './participant-session-exception.filter';
import {
    CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL,
    GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL,
    PARTICIPANT_LOGIN_USE_CASE_SYMBOL,
    SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL,
} from './participant.tokens';

type RequestWithParticipant = Request & { user: JwtValidatedUser };

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
        @Inject(PARTICIPANTS_REPOSITORY_PORT_SYMBOL)
        private readonly participantsWriter: IParticipantsIdentityReaderPort & IParticipantsWriterPort
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

    @Post('auth/login')
    @UseFilters(ParticipantAuthExceptionFilter)
    public async login(@Body() body: { email?: string; password?: string }) {
        const email = body.email ?? '';
        const password = body.password ?? '';
        const result = await this.participantLogin.execute(email, password);
        return { access_token: result.accessToken };
    }

    @Get('matrix')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async matrix(
        @Req() req: RequestWithParticipant,
        @Query('qid') qid?: string,
        @Query('campaign_id') campaignId?: string
    ) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        const normalizedQid = ParticipantController.normalizeQid(qid);
        const normalizedCampaignId = ParticipantController.normalizePositiveInt(campaignId);
        if (campaignId !== undefined && campaignId.trim() !== '' && normalizedCampaignId === undefined) {
            throw new BadRequestException('Paramètre campaign_id invalide.');
        }
        return this.getParticipantSessionMatrix.execute(participantId, normalizedQid, normalizedCampaignId);
    }

    @Post('campaigns/:campaignId/confirm')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async confirmCampaign(
        @Req() req: RequestWithParticipant,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        return this.confirmCampaignParticipation.execute(participantId, campaignId);
    }

    @Get('campaigns/:campaignId/peers')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async campaignPeers(
        @Req() req: RequestWithParticipant,
        @Param('campaignId', ParseIntPipe) campaignId: number
    ) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        return this.listParticipantCampaignPeers.execute(participantId, campaignId);
    }

    @Get('session')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ParticipantSessionExceptionFilter)
    public async session(@Req() req: RequestWithParticipant) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        return this.getParticipantSession.execute(participantId);
    }

    @Get('responses/:responseId')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ResponsesExceptionFilter)
    public async getResponse(
        @Req() req: RequestWithParticipant,
        @Param('responseId', ParseIntPipe) responseId: number
    ) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        return this.getParticipantOwnedResponse.execute(participantId, responseId);
    }

    @Post('questionnaires/:qid/submit')
    @UseGuards(ParticipantJwtAuthGuard)
    @UseFilters(ResponsesExceptionFilter)
    public async submitQuestionnaire(
        @Req() req: RequestWithParticipant,
        @Param('qid') qid: string,
        @Query('campaign_id') campaignId: string | undefined,
        @Body() body: unknown
    ) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        const normalizedCampaignId = ParticipantController.normalizePositiveInt(campaignId);
        if (campaignId !== undefined && campaignId.trim() !== '' && normalizedCampaignId === undefined) {
            throw new BadRequestException('Paramètre campaign_id invalide.');
        }
        return this.submitParticipantQuestionnaire.execute(participantId, qid, body, normalizedCampaignId);
    }

    @Patch('profile')
    @UseGuards(ParticipantJwtAuthGuard)
    public async updateProfile(@Req() req: RequestWithParticipant, @Body() body: unknown) {
        const participantId = req.user.participantId;
        if (participantId === undefined || !Number.isFinite(participantId)) {
            throw new UnauthorizedException();
        }
        const parsed = updateParticipantProfileBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException('Données de profil invalides.');
        }
        const data = parsed.data;
        const current = await this.participantsWriter.findById(participantId);
        if (!current) {
            throw new UnauthorizedException();
        }
        const updated = current.updateProfile({
            ...(data.organisation !== undefined ? { organisation: data.organisation } : {}),
            ...(data.direction !== undefined ? { direction: data.direction } : {}),
            ...(data.service !== undefined ? { service: data.service } : {}),
            ...(data.function_level !== undefined ? { functionLevel: data.function_level } : {}),
        });
        await this.participantsWriter.save(updated);
        return { ok: true };
    }
}
