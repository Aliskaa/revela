// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Body, Controller, Get, Inject, Param, Post, Res, UseFilters, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';

import type { RefreshTokenManagerUseCase } from '@src/application/auth/refresh-token-manager.usecase';
import type { ActivateInviteWithPasswordUseCase } from '@src/application/invitations/activate-invite-with-password.usecase';
import type { ConfirmInviteParticipationUseCase } from '@src/application/invitations/confirm-invite-participation.usecase';
import type { GetInvitePreviewUseCase } from '@src/application/invitations/get-invite-preview.usecase';
import type { SubmitInviteQuestionnaireUseCase } from '@src/application/invitations/submit-invite-questionnaire.usecase';
import { setAuthCookies } from '@src/presentation/auth/auth-cookies.helper';
import { REFRESH_TOKEN_MANAGER_SYMBOL } from '@src/presentation/auth/auth-refresh.module';

import { InvitationsPublicExceptionFilter } from './invitations-public-exception.filter';
import {
    ACTIVATE_INVITE_WITH_PASSWORD_USE_CASE_SYMBOL,
    CONFIRM_INVITE_PARTICIPATION_USE_CASE_SYMBOL,
    GET_INVITE_PREVIEW_USE_CASE_SYMBOL,
    SUBMIT_INVITE_QUESTIONNAIRE_USE_CASE_SYMBOL,
} from './invitations-public.tokens';

@ApiTags('invitations')
@Controller('invite')
@UseFilters(InvitationsPublicExceptionFilter)
export class PublicInvitesController {
    public constructor(
        @Inject(GET_INVITE_PREVIEW_USE_CASE_SYMBOL)
        private readonly getInvitePreview: GetInvitePreviewUseCase,
        @Inject(SUBMIT_INVITE_QUESTIONNAIRE_USE_CASE_SYMBOL)
        private readonly submitInviteQuestionnaire: SubmitInviteQuestionnaireUseCase,
        @Inject(ACTIVATE_INVITE_WITH_PASSWORD_USE_CASE_SYMBOL)
        private readonly activateInviteWithPassword: ActivateInviteWithPasswordUseCase,
        @Inject(CONFIRM_INVITE_PARTICIPATION_USE_CASE_SYMBOL)
        private readonly confirmInviteParticipation: ConfirmInviteParticipationUseCase,
        @Inject(REFRESH_TOKEN_MANAGER_SYMBOL)
        private readonly refreshTokens: RefreshTokenManagerUseCase
    ) {}

    @Get(':token')
    @ApiOperation({ summary: 'Aperçu public d’une invitation à partir de son token (sans authentification).' })
    public getInvite(@Param('token') token: string) {
        return this.getInvitePreview.execute(token);
    }

    @Post(':token/confirm-participation')
    @ApiOperation({ summary: 'Confirme la participation rattachée à un token d’invitation.' })
    public confirmParticipation(@Param('token') token: string) {
        return this.confirmInviteParticipation.execute(token);
    }

    /**
     * Active un invite : pose le mot de passe, consume le token, et ouvre une session
     * participant via cookies httpOnly (G1 RGPD). Le client n'a pas accès au JWT.
     * Rate limit strict (G8) : 5 tentatives/min/IP — la consommation du token réussie est
     * de toute façon irréversible, mais on bloque le brute-force sur le token + password.
     */
    @Post(':token/activate')
    @UseGuards(ThrottlerGuard)
    @Throttle({ 'auth-strict': { limit: 5, ttl: 60_000 } })
    @ApiOperation({
        summary:
            'Active une invitation : pose le mot de passe, consomme le token et ouvre une session participant (cookies httpOnly).',
    })
    public async activateInvite(
        @Param('token') token: string,
        @Body() body: { password?: string },
        @Res({ passthrough: true }) res: Response
    ) {
        const result = await this.activateInviteWithPassword.execute(token, body.password ?? '');
        const refreshIssued = await this.refreshTokens.issue('participant', result.participantId);
        setAuthCookies(res, {
            scope: 'participant',
            accessToken: result.accessToken,
            refreshToken: refreshIssued.rawToken,
            refreshExpiresAt: refreshIssued.expiresAt,
        });
        return { participant_id: result.participantId };
    }

    @Post(':token/submit')
    @ApiOperation({ summary: 'Soumet les réponses d’un questionnaire via un token d’invitation public.' })
    public submitInvite(@Param('token') token: string, @Body() body: unknown) {
        return this.submitInviteQuestionnaire.execute(token, body);
    }
}
