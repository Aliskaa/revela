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
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AdminAuthUseCase } from '@src/application/admin/auth/admin-auth.usecase';
import { CreateAdminCampaignUseCase } from '@src/application/admin/campaigns/create-admin-campaign.usecase';
import { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import { ImportParticipantsToCampaignUseCase } from '@src/application/admin/campaigns/import-participants-to-campaign.usecase';
import { InviteCampaignParticipantsUseCase } from '@src/application/admin/campaigns/invite-campaign-participants.usecase';
import { ListAdminCampaignsUseCase } from '@src/application/admin/campaigns/list-admin-campaigns.usecase';
import { ReassignAdminCampaignCoachUseCase } from '@src/application/admin/campaigns/reassign-admin-campaign-coach.usecase';
import { UpdateAdminCampaignStatusUseCase } from '@src/application/admin/campaigns/update-admin-campaign-status.usecase';
import { CreateAdminCoachUseCase } from '@src/application/admin/coaches/create-admin-coach.usecase';
import { DeleteAdminCoachUseCase } from '@src/application/admin/coaches/delete-admin-coach.usecase';
import { GetAdminCoachDetailUseCase } from '@src/application/admin/coaches/get-admin-coach-detail.usecase';
import { ListAdminCoachesUseCase } from '@src/application/admin/coaches/list-admin-coaches.usecase';
import { UpdateAdminCoachUseCase } from '@src/application/admin/coaches/update-admin-coach.usecase';
import { CreateAdminCompanyUseCase } from '@src/application/admin/companies/create-admin-company.usecase';
import { DeleteAdminCompanyUseCase } from '@src/application/admin/companies/delete-admin-company.usecase';
import { GetAdminCompanyUseCase } from '@src/application/admin/companies/get-admin-company.usecase';
import { ListAdminCompaniesUseCase } from '@src/application/admin/companies/list-admin-companies.usecase';
import { UpdateAdminCompanyUseCase } from '@src/application/admin/companies/update-admin-company.usecase';
import { GetAdminDashboardUseCase } from '@src/application/admin/dashboard/get-admin-dashboard.usecase';
import { GetAdminMailStatusUseCase } from '@src/application/admin/mail/get-admin-mail-status.usecase';
import { CreateParticipantInviteUseCase } from '@src/application/admin/participants/create-participant-invite.usecase';
import { EraseParticipantRgpdUseCase } from '@src/application/admin/participants/erase-participant-rgpd.usecase';
import { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import { ListAdminParticipantsUseCase } from '@src/application/admin/participants/list-admin-participants.usecase';
import { ListParticipantInvitationTokensUseCase } from '@src/application/admin/participants/list-participant-invitation-tokens.usecase';
import { DeleteAdminResponseUseCase } from '@src/application/admin/responses/delete-admin-response.usecase';
import { ExportAdminAnonymizedResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-anonymized-responses-csv.usecase';
import { ExportAdminResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-responses-csv.usecase';
import { ListAdminResponsesUseCase } from '@src/application/admin/responses/list-admin-responses.usecase';
import { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant/get-participant-questionnaire-matrix.usecase';
import { ScryptPasswordAdapter } from '@aor/adapters';
import { NodemailerMailAdapter } from '@src/infrastructure/mail/nodemailer-mail.adapter';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
    type IAdminTokenSignerPort,
} from '@src/interfaces/admin/IAdminTokenSigner.port';
import {
    CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL,
    type ICutoverStrategyConfigPort,
} from '@src/interfaces/admin/ICutoverStrategyConfig.port';
import { type IInviteUrlConfigPort, INVITE_URL_CONFIG_PORT_SYMBOL } from '@src/interfaces/admin/IInviteUrlConfig.port';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
    type ICampaignsWritePort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import {
    type ICoachesReadPort,
    COACHES_REPOSITORY_PORT_SYMBOL,
    type ICoachesWritePort,
} from '@src/interfaces/coaches/ICoachesRepository.port';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
    type ICompaniesWritePort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import {
    type IInvitationsReadPort,
    type IInvitationsWritePort,
    INVITATIONS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/invitations/IInvitationsRepository.port';
import { type IMailPort, MAIL_PORT_SYMBOL } from '@src/interfaces/invitations/IMail.port';
import {
    type IParticipantsAdminReadPort,
    type IParticipantsCampaignParticipationWriterPort,
    type IParticipantsIdentityReaderPort,
    type IParticipantsInviteAssignmentsReaderPort,
    type IParticipantsMetricsPort,
    type IParticipantsWriterPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesAdminListPort,
    type IResponsesExportPort,
    type IResponsesMetricsPort,
    type IResponsesSubmissionReaderPort,
    type IResponsesWriterPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';
import {
    PASSWORD_HASHER_PORT_SYMBOL,
    type IPasswordHasherPort,
    PASSWORD_VERIFIER_PORT_SYMBOL,
    type IPasswordVerifierPort,
} from '@aor/ports';
import { ResponsesModule } from '@src/presentation/responses/responses.module';

import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { AdminCoachesController } from './admin-coaches.controller';
import { AdminCompaniesController } from './admin-companies.controller';
import { AdminParticipantsController } from './admin-participants.controller';
import { AdminManagementController } from './admin-management.controller';
import { AdminResponsesController } from './admin-responses.controller';
import { AdminController } from './admin.controller';
import {
    ADMIN_AUTH_USE_CASE_SYMBOL,
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
    CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
    DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
    DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL,
    ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
    EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL,
    EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
    GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL,
    GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL,
    GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
    LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
    LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
} from './admin.tokens';
import { JwtStrategy } from './jwt.strategy';

const ADMIN_COMPANIES_PROVIDERS = [
    {
        provide: LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
        useFactory: (companies: ICompaniesReadPort) => new ListAdminCompaniesUseCase({ companies }),
        inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
        useFactory: (companies: ICompaniesReadPort) => new GetAdminCompanyUseCase({ companies }),
        inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
        useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) => new CreateAdminCompanyUseCase({ companies }),
        inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
        useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) => new UpdateAdminCompanyUseCase({ companies }),
        inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
        useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) => new DeleteAdminCompanyUseCase({ companies }),
        inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
    },
];

const ADMIN_COACHES_PROVIDERS = [
    {
        provide: LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
        useFactory: (coaches: ICoachesReadPort) => new ListAdminCoachesUseCase({ coaches }),
        inject: [COACHES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
        useFactory: (coaches: ICoachesReadPort & ICoachesWritePort, passwordHasher: IPasswordHasherPort) =>
            new CreateAdminCoachUseCase({ coaches, passwordHasher }),
        inject: [COACHES_REPOSITORY_PORT_SYMBOL, PASSWORD_HASHER_PORT_SYMBOL],
    },
    {
        provide: GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
        useFactory: (coaches: ICoachesReadPort, campaigns: ICampaignsReadPort) =>
            new GetAdminCoachDetailUseCase({ coaches, campaigns }),
        inject: [COACHES_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
        useFactory: (coaches: ICoachesReadPort & ICoachesWritePort, passwordHasher: IPasswordHasherPort) =>
            new UpdateAdminCoachUseCase({ coaches, passwordHasher }),
        inject: [COACHES_REPOSITORY_PORT_SYMBOL, PASSWORD_HASHER_PORT_SYMBOL],
    },
    {
        provide: DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
        useFactory: (coaches: ICoachesReadPort & ICoachesWritePort, campaigns: ICampaignsReadPort) =>
            new DeleteAdminCoachUseCase({ coaches, campaigns }),
        inject: [COACHES_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
    },
];

const ADMIN_CAMPAIGNS_PROVIDERS = [
    {
        provide: LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
        useFactory: (campaigns: ICampaignsReadPort) => new ListAdminCampaignsUseCase({ campaigns }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
        useFactory: (
            campaigns: ICampaignsReadPort & ICampaignsWritePort,
            companies: ICompaniesReadPort,
            coaches: ICoachesReadPort
        ) => new CreateAdminCampaignUseCase({ campaigns, companies, coaches }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, COMPANIES_REPOSITORY_PORT_SYMBOL, COACHES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
        useFactory: (campaigns: ICampaignsWritePort) => new UpdateAdminCampaignStatusUseCase({ campaigns }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
        useFactory: (campaigns: ICampaignsReadPort & ICampaignsWritePort, coaches: ICoachesReadPort) =>
            new ReassignAdminCampaignCoachUseCase({ campaigns, coaches }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, COACHES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
        useFactory: (
            campaigns: ICampaignsReadPort,
            participants: IParticipantsAdminReadPort,
            responses: IResponsesAdminListPort
        ) => new GetAdminCampaignDetailUseCase({ campaigns, participants, responses }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
        useFactory: (
            campaigns: ICampaignsReadPort,
            participants: IParticipantsAdminReadPort & IParticipantsCampaignParticipationWriterPort,
            invitations: IInvitationsWritePort
        ) => new InviteCampaignParticipantsUseCase({ campaigns, participants, invitations }),
        inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, PARTICIPANTS_REPOSITORY_PORT_SYMBOL, INVITATIONS_REPOSITORY_PORT_SYMBOL],
    },
    {
        provide: IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
        useFactory: (
            campaigns: ICampaignsReadPort,
            companies: ICompaniesReadPort,
            participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort & IParticipantsCampaignParticipationWriterPort,
            invitations: IInvitationsWritePort
        ) =>
            new ImportParticipantsToCampaignUseCase({
                campaigns,
                companies,
                participants,
                invitations,
            }),
        inject: [
            CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
            COMPANIES_REPOSITORY_PORT_SYMBOL,
            PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
            INVITATIONS_REPOSITORY_PORT_SYMBOL,
        ],
    },
];

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'dev-insecure-change-me',
            signOptions: { expiresIn: '7d' },
        }),
        ResponsesModule,
    ],
    controllers: [
        AdminController,
        AdminResponsesController,
        AdminParticipantsController,
        AdminCompaniesController,
        AdminCoachesController,
        AdminCampaignsController,
        AdminManagementController,
    ],
    providers: [
        {
            provide: ADMIN_AUTH_CONFIG_PORT_SYMBOL,
            useFactory: (): IAdminAuthConfigPort => ({
                superAdminUsername: process.env.ADMIN_USERNAME ?? 'admin',
                superAdminPassword: process.env.ADMIN_PASSWORD ?? 'admin',
            }),
        },
        {
            provide: INVITE_URL_CONFIG_PORT_SYMBOL,
            useFactory: (): IInviteUrlConfigPort => ({
                frontendBaseUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
            }),
        },
        {
            provide: CUTOVER_STRATEGY_CONFIG_PORT_SYMBOL,
            useFactory: (): ICutoverStrategyConfigPort => {
                const strategy = process.env.ADMIN_CUTOVER_STRATEGY;
                if (strategy === 'dual-run' || strategy === 'new-flow') {
                    return { strategy };
                }
                return { strategy: 'legacy' };
            },
        },
        {
            provide: ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
            useFactory: (jwtService: JwtService): IAdminTokenSignerPort => ({
                sign: (payload: { sub: string; role: 'admin'; scope: 'super-admin' | 'coach'; coachId?: number }) =>
                    jwtService.sign(payload),
            }),
            inject: [JwtService],
        },
        {
            provide: ADMIN_AUTH_USE_CASE_SYMBOL,
            useFactory: (
                authConfig: IAdminAuthConfigPort,
                signer: IAdminTokenSignerPort,
                coaches: ICoachesReadPort,
                passwordVerifier: IPasswordVerifierPort
            ) => new AdminAuthUseCase({ authConfig, tokenSigner: signer, coaches, passwordVerifier }),
            inject: [
                ADMIN_AUTH_CONFIG_PORT_SYMBOL,
                ADMIN_TOKEN_SIGNER_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
                PASSWORD_VERIFIER_PORT_SYMBOL,
            ],
        },
        JwtStrategy,
        AdminJwtAuthGuard,
        NodemailerMailAdapter,
        ScryptPasswordAdapter,
        { provide: PASSWORD_HASHER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        { provide: PASSWORD_VERIFIER_PORT_SYMBOL, useExisting: ScryptPasswordAdapter },
        { provide: MAIL_PORT_SYMBOL, useExisting: NodemailerMailAdapter },
        {
            provide: GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL,
            useFactory: (
                responses: IResponsesMetricsPort,
                participants: IParticipantsMetricsPort,
                companies: ICompaniesReadPort
            ) => new GetAdminDashboardUseCase({ responses, participants, companies }),
            inject: [
                RESPONSES_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesAdminListPort) => new ListAdminResponsesUseCase({ responses }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesWriterPort) => new DeleteAdminResponseUseCase({ responses }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsAdminReadPort) =>
                new ListAdminParticipantsUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
            useFactory: (
                companies: ICompaniesReadPort & ICompaniesWritePort,
                participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort,
                invitations: IInvitationsWritePort
            ) => new ImportParticipantsCsvUseCase({ companies, participants, invitations }),
            inject: [
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort & IParticipantsCampaignParticipationWriterPort,
                campaigns: ICampaignsReadPort,
                invitations: IInvitationsWritePort,
                mail: IMailPort,
                inviteUrlConfig: IInviteUrlConfigPort
            ) => new CreateParticipantInviteUseCase({ participants, campaigns, invitations, mail, inviteUrlConfig }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
                MAIL_PORT_SYMBOL,
                INVITE_URL_CONFIG_PORT_SYMBOL,
            ],
        },
        {
            provide: LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort & IParticipantsInviteAssignmentsReaderPort,
                invitations: IInvitationsReadPort,
                inviteUrlConfig: IInviteUrlConfigPort
            ) => new ListParticipantInvitationTokensUseCase({ participants, invitations, inviteUrlConfig }),
            inject: [
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
                INVITE_URL_CONFIG_PORT_SYMBOL,
            ],
        },
        {
            provide: ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsWriterPort) =>
                new EraseParticipantRgpdUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL,
            useFactory: (mail: IMailPort) => new GetAdminMailStatusUseCase({ mail }),
            inject: [MAIL_PORT_SYMBOL],
        },
        ...ADMIN_COMPANIES_PROVIDERS,
        {
            provide: EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesExportPort) => new ExportAdminResponsesCsvUseCase({ responses }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesExportPort, companies: ICompaniesReadPort) =>
                new ExportAdminAnonymizedResponsesCsvUseCase({ responses, companies }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL, COMPANIES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsIdentityReaderPort, responses: IResponsesSubmissionReaderPort) =>
                new GetParticipantQuestionnaireMatrixUseCase({ participants, responses }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        ...ADMIN_COACHES_PROVIDERS,
        ...ADMIN_CAMPAIGNS_PROVIDERS,
    ],
})
export class AdminModule {}
