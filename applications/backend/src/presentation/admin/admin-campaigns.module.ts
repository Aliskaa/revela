// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { AddParticipantToCampaignUseCase } from '@src/application/admin/campaigns/add-participant-to-campaign.usecase';
import { CreateAdminCampaignUseCase } from '@src/application/admin/campaigns/create-admin-campaign.usecase';
import { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import { GetAdminCampaignParticipantMatrixUseCase } from '@src/application/admin/campaigns/get-admin-campaign-participant-matrix.usecase';
import { GetAdminCampaignSynthesisMatrixUseCase } from '@src/application/admin/campaigns/get-admin-campaign-synthesis-matrix.usecase';
import { ImportParticipantsToCampaignUseCase } from '@src/application/admin/campaigns/import-participants-to-campaign.usecase';
import { InviteCampaignParticipantsUseCase } from '@src/application/admin/campaigns/invite-campaign-participants.usecase';
import { ListAdminCampaignsUseCase } from '@src/application/admin/campaigns/list-admin-campaigns.usecase';
import { ReassignAdminCampaignCoachUseCase } from '@src/application/admin/campaigns/reassign-admin-campaign-coach.usecase';
import { UpdateAdminCampaignStatusUseCase } from '@src/application/admin/campaigns/update-admin-campaign-status.usecase';
import { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import { ActivateParticipantTransparencyScoreUseCase } from '@src/application/transparency/activate-participant-transparency-score.usecase';
import { GetParticipantTransparencyScoreUseCase } from '@src/application/transparency/get-participant-transparency-score.usecase';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
    type ICampaignsWritePort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import {
    type IInvitationsWritePort,
    INVITATIONS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/invitations/IInvitationsRepository.port';
import {
    type IParticipantsAdminReadPort,
    type IParticipantsCampaignParticipationWriterPort,
    type IParticipantsIdentityReaderPort,
    type IParticipantsTransparencyScorePort,
    type IParticipantsWriterPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesAdminListPort,
    type IResponsesSubmissionReaderPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { AuditModule } from '@src/presentation/audit/audit.module';
import { GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL } from '@src/presentation/participant-session/participant.tokens';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    ACTIVATE_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    ADD_PARTICIPANT_TO_CAMPAIGN_USE_CASE_SYMBOL,
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_PARTICIPANT_MATRIX_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_SYNTHESIS_MATRIX_USE_CASE_SYMBOL,
    GET_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';
import { CampaignAccessGuard } from './campaign-access.guard';

@Module({
    imports: [AdminSharedModule, AuditModule],
    controllers: [AdminCampaignsController],
    providers: [
        CampaignAccessGuard,
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
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
            useFactory: (campaigns: ICampaignsReadPort & ICampaignsWritePort) =>
                new UpdateAdminCampaignStatusUseCase({ campaigns }),
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
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                RESPONSES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: GET_ADMIN_CAMPAIGN_SYNTHESIS_MATRIX_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                participants: IParticipantsAdminReadPort,
                responses: IResponsesSubmissionReaderPort
            ) => new GetAdminCampaignSynthesisMatrixUseCase({ campaigns, participants, responses }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                RESPONSES_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                participants: IParticipantsAdminReadPort & IParticipantsCampaignParticipationWriterPort,
                invitations: IInvitationsWritePort
            ) => new InviteCampaignParticipantsUseCase({ campaigns, participants, invitations }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                companies: ICompaniesReadPort,
                participants: IParticipantsIdentityReaderPort &
                    IParticipantsWriterPort &
                    IParticipantsCampaignParticipationWriterPort,
                invitations: IInvitationsWritePort
            ) => new ImportParticipantsToCampaignUseCase({ campaigns, companies, participants, invitations }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: ADD_PARTICIPANT_TO_CAMPAIGN_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                companies: ICompaniesReadPort,
                participants: IParticipantsIdentityReaderPort &
                    IParticipantsWriterPort &
                    IParticipantsCampaignParticipationWriterPort,
                invitations: IInvitationsWritePort
            ) => new AddParticipantToCampaignUseCase({ campaigns, companies, participants, invitations }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                INVITATIONS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort & IParticipantsAdminReadPort,
                responses: IResponsesSubmissionReaderPort
            ) => new GetParticipantQuestionnaireMatrixUseCase({ participants, responses }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
        {
            // Orchestration admin (axe participation) : dérive `qid` de la campagne puis délègue à
            // `GetParticipantQuestionnaireMatrixUseCase`. Miroir de la self-route participant.
            provide: GET_ADMIN_CAMPAIGN_PARTICIPANT_MATRIX_USE_CASE_SYMBOL,
            useFactory: (campaigns: ICampaignsReadPort, getMatrix: GetParticipantQuestionnaireMatrixUseCase) =>
                new GetAdminCampaignParticipantMatrixUseCase({ campaigns, getMatrix }),
            inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL],
        },
        {
            provide: ACTIVATE_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                coaches: ICoachesReadPort,
                authConfig: IAdminAuthConfigPort,
                transparency: IParticipantsTransparencyScorePort,
                getMatrix: GetParticipantQuestionnaireMatrixUseCase
            ) =>
                new ActivateParticipantTransparencyScoreUseCase({
                    campaigns,
                    coaches,
                    authConfig,
                    transparency,
                    getMatrix,
                }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
                ADMIN_AUTH_CONFIG_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
                GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            ],
        },
        {
            provide: GET_PARTICIPANT_TRANSPARENCY_SCORE_USE_CASE_SYMBOL,
            useFactory: (transparency: IParticipantsTransparencyScorePort) =>
                new GetParticipantTransparencyScoreUseCase({ transparency }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
    ],
    exports: [GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL],
})
export class AdminCampaignsModule {}
