// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { CreateAdminCampaignUseCase } from '@src/application/admin/campaigns/create-admin-campaign.usecase';
import { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import { ImportParticipantsToCampaignUseCase } from '@src/application/admin/campaigns/import-participants-to-campaign.usecase';
import { InviteCampaignParticipantsUseCase } from '@src/application/admin/campaigns/invite-campaign-participants.usecase';
import { ListAdminCampaignsUseCase } from '@src/application/admin/campaigns/list-admin-campaigns.usecase';
import { ReassignAdminCampaignCoachUseCase } from '@src/application/admin/campaigns/reassign-admin-campaign-coach.usecase';
import { UpdateAdminCampaignStatusUseCase } from '@src/application/admin/campaigns/update-admin-campaign-status.usecase';
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
    type IParticipantsWriterPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesAdminListPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { AdminCampaignsController } from './admin-campaigns.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    CREATE_ADMIN_CAMPAIGN_USE_CASE_SYMBOL,
    GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_TO_CAMPAIGN_USE_CASE_SYMBOL,
    INVITE_CAMPAIGN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_ADMIN_CAMPAIGNS_USE_CASE_SYMBOL,
    REASSIGN_ADMIN_CAMPAIGN_COACH_USE_CASE_SYMBOL,
    UPDATE_ADMIN_CAMPAIGN_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminCampaignsController],
    providers: [
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
    ],
    exports: [GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL],
})
export class AdminCampaignsModule {}
