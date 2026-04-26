// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ScryptPasswordAdapter } from '@aor/adapters';
import { type IPasswordVerifierPort, PASSWORD_VERIFIER_PORT_SYMBOL } from '@aor/ports';
import { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant/get-participant-questionnaire-matrix.usecase';
import { GetParticipantSessionQuestionnaireMatrixUseCase } from '@src/application/participant/get-participant-session-questionnaire-matrix.usecase';
import { GetParticipantSessionUseCase } from '@src/application/participant/get-participant-session.usecase';
import { ListParticipantCampaignPeersUseCase } from '@src/application/participant/list-participant-campaign-peers.usecase';
import { ParticipantLoginUseCase } from '@src/application/participant/participant-login.usecase';
import { GetParticipantOwnedResponseUseCase } from '@src/application/responses/get-participant-owned-response.usecase';
import { SubmitParticipantQuestionnaireUseCase } from '@src/application/responses/submit-participant-questionnaire.usecase';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import {
    type IParticipantJwtSignerPort,
    PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
} from '@src/interfaces/participant/IParticipantJwtSigner.port';
import {
    type IParticipantsCampaignStateReaderPort,
    type IParticipantsIdentityReaderPort,
    type IParticipantsInviteAssignmentsReaderPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesRecordReaderPort,
    type IResponsesSubmissionReaderPort,
    type IResponsesWriterPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL } from '@src/presentation/admin/admin.tokens';
import { requireEnv } from '@src/shared/env';

import { ParticipantJwtAuthGuard } from './participant-jwt-auth.guard';
import { ParticipantController } from './participant.controller';
import {
    GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL,
    PARTICIPANT_LOGIN_USE_CASE_SYMBOL,
    SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL,
} from './participant.tokens';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: requireEnv('JWT_SECRET'),
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [ParticipantController],
    providers: [
        ParticipantJwtAuthGuard,
        ScryptPasswordAdapter,
        { provide: PASSWORD_VERIFIER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        {
            provide: PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
            useFactory: (jwtService: JwtService): IParticipantJwtSignerPort => ({
                signAccessToken: (participantId: number) =>
                    jwtService.sign({ sub: String(participantId), role: 'participant' }),
            }),
            inject: [JwtService],
        },
        {
            provide: PARTICIPANT_LOGIN_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort,
                jwtSigner: IParticipantJwtSignerPort,
                passwordVerifier: IPasswordVerifierPort
            ) => new ParticipantLoginUseCase({ participants, jwtSigner, passwordVerifier }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                PARTICIPANT_JWT_SIGNER_PORT_SYMBOL,
                PASSWORD_VERIFIER_PORT_SYMBOL,
            ],
        },
        {
            provide: GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsIdentityReaderPort, responses: IResponsesSubmissionReaderPort) =>
                new GetParticipantQuestionnaireMatrixUseCase({ participants, responses }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_PARTICIPANT_SESSION_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort &
                    IParticipantsInviteAssignmentsReaderPort &
                    IParticipantsCampaignStateReaderPort,
                campaigns: ICampaignsReadPort,
                companies: ICompaniesReadPort,
                coaches: ICoachesReadPort
            ) => new GetParticipantSessionUseCase({ participants, campaigns, companies, coaches }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: GET_PARTICIPANT_SESSION_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsInviteAssignmentsReaderPort,
                campaigns: ICampaignsReadPort,
                getMatrix: GetParticipantQuestionnaireMatrixUseCase
            ) =>
                new GetParticipantSessionQuestionnaireMatrixUseCase({
                    participants,
                    campaigns,
                    getMatrix,
                }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            ],
        },
        {
            provide: SUBMIT_PARTICIPANT_QUESTIONNAIRE_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort &
                    IParticipantsInviteAssignmentsReaderPort &
                    IParticipantsCampaignStateReaderPort,
                companies: ICompaniesReadPort,
                campaigns: ICampaignsReadPort,
                responses: IResponsesWriterPort & IResponsesSubmissionReaderPort
            ) => new SubmitParticipantQuestionnaireUseCase({ participants, companies, campaigns, responses }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                RESPONSES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: GET_PARTICIPANT_OWNED_RESPONSE_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesRecordReaderPort) =>
                new GetParticipantOwnedResponseUseCase({ responses }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: LIST_PARTICIPANT_CAMPAIGN_PEERS_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsInviteAssignmentsReaderPort & IParticipantsCampaignStateReaderPort,
                campaigns: ICampaignsReadPort
            ) => new ListParticipantCampaignPeersUseCase({ participants, campaigns }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
        },
    ],
    exports: [PARTICIPANT_JWT_SIGNER_PORT_SYMBOL, ParticipantJwtAuthGuard],
})
export class ParticipantModule {}
