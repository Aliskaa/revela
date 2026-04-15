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

import { Module } from '@nestjs/common';

import { ActivateInviteWithPasswordUseCase } from '@src/application/invitations/activate-invite-with-password.usecase';
import { ConfirmInviteParticipationUseCase } from '@src/application/invitations/confirm-invite-participation.usecase';
import { GetInvitePreviewUseCase } from '@src/application/invitations/get-invite-preview.usecase';
import { InviteTokenValidationUseCase } from '@src/application/invitations/invite-token-validation.usecase';
import { SubmitInviteQuestionnaireUseCase } from '@src/application/invitations/submit-invite-questionnaire.usecase';
import { ScryptPasswordAdapter } from '@aor/adapters';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import {
    type IInvitationsReadPort,
    INVITATIONS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/invitations/IInvitationsRepository.port';
import {
    type IInviteActivationWritePort,
    INVITE_ACTIVATION_WRITE_PORT_SYMBOL,
} from '@src/interfaces/invitations/IInviteActivationWrite.port';
import {
    type IParticipantJwtSignerPort,
    PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
} from '@src/interfaces/participant/IParticipantJwtSigner.port';
import {
    type IParticipantsCampaignParticipationWriterPort,
    type IParticipantsCampaignStateReaderPort,
    type IParticipantsIdentityReaderPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesWriterPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';
import {
    PASSWORD_HASHER_PORT_SYMBOL,
    type IPasswordHasherPort,
} from '@aor/ports';

import { ParticipantModule } from '@src/presentation/participant/participant.module';

import { PublicInvitesController } from './invitations-public.controller';
import {
    ACTIVATE_INVITE_WITH_PASSWORD_USE_CASE_SYMBOL,
    CONFIRM_INVITE_PARTICIPATION_USE_CASE_SYMBOL,
    GET_INVITE_PREVIEW_USE_CASE_SYMBOL,
    INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL,
    SUBMIT_INVITE_QUESTIONNAIRE_USE_CASE_SYMBOL,
} from './invitations-public.tokens';

@Module({
    imports: [ParticipantModule],
    controllers: [PublicInvitesController],
    providers: [
        ScryptPasswordAdapter,
        { provide: PASSWORD_HASHER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        {
            provide: INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL,
            useFactory: (invitations: IInvitationsReadPort) => new InviteTokenValidationUseCase({ invitations }),
            inject: [INVITATIONS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_INVITE_PREVIEW_USE_CASE_SYMBOL,
            useFactory: (
                tokenValidation: InviteTokenValidationUseCase,
                participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort,
                companies: ICompaniesReadPort,
                campaigns: ICampaignsReadPort
            ) => new GetInvitePreviewUseCase({ tokenValidation, participants, companies, campaigns }),
            inject: [
                INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: CONFIRM_INVITE_PARTICIPATION_USE_CASE_SYMBOL,
            useFactory: (
                tokenValidation: InviteTokenValidationUseCase,
                participants: IParticipantsCampaignParticipationWriterPort
            ) =>
                new ConfirmInviteParticipationUseCase({ tokenValidation, participants }),
            inject: [INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL, PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: SUBMIT_INVITE_QUESTIONNAIRE_USE_CASE_SYMBOL,
            useFactory: (
                tokenValidation: InviteTokenValidationUseCase,
                participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort,
                companies: ICompaniesReadPort,
                campaigns: ICampaignsReadPort,
                responses: IResponsesWriterPort
            ) =>
                new SubmitInviteQuestionnaireUseCase({
                    tokenValidation,
                    participants,
                    companies,
                    campaigns,
                    responses,
                }),
            inject: [
                INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                RESPONSES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: ACTIVATE_INVITE_WITH_PASSWORD_USE_CASE_SYMBOL,
            useFactory: (
                tokenValidation: InviteTokenValidationUseCase,
                participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort,
                activationWrite: IInviteActivationWritePort,
                jwtSigner: IParticipantJwtSignerPort,
                passwordHasher: IPasswordHasherPort
            ) =>
                new ActivateInviteWithPasswordUseCase({
                    tokenValidation,
                    participants,
                    activationWrite,
                    jwtSigner,
                    passwordHasher,
                }),
            inject: [
                INVITE_TOKEN_VALIDATION_USE_CASE_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITE_ACTIVATION_WRITE_PORT_SYMBOL,
                PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
                PASSWORD_HASHER_PORT_SYMBOL,
            ],
        },
    ],
})
export class InvitationsPublicModule {}
