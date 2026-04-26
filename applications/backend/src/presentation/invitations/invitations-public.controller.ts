// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Body, Controller, Get, Inject, Param, Post, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { ActivateInviteWithPasswordUseCase } from '@src/application/invitations/activate-invite-with-password.usecase';
import type { ConfirmInviteParticipationUseCase } from '@src/application/invitations/confirm-invite-participation.usecase';
import type { GetInvitePreviewUseCase } from '@src/application/invitations/get-invite-preview.usecase';
import type { SubmitInviteQuestionnaireUseCase } from '@src/application/invitations/submit-invite-questionnaire.usecase';

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
        private readonly confirmInviteParticipation: ConfirmInviteParticipationUseCase
    ) {}

    @Get(':token')
    public getInvite(@Param('token') token: string) {
        return this.getInvitePreview.execute(token);
    }

    @Post(':token/confirm-participation')
    public confirmParticipation(@Param('token') token: string) {
        return this.confirmInviteParticipation.execute(token);
    }

    @Post(':token/activate')
    public async activateInvite(@Param('token') token: string, @Body() body: { password?: string }) {
        const result = await this.activateInviteWithPassword.execute(token, body.password ?? '');
        return { access_token: result.accessToken };
    }

    @Post(':token/submit')
    public submitInvite(@Param('token') token: string, @Body() body: unknown) {
        return this.submitInviteQuestionnaire.execute(token, body);
    }
}
