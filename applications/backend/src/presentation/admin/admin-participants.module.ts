// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { CreateParticipantInviteUseCase } from '@src/application/admin/participants/create-participant-invite.usecase';
import { EraseParticipantRgpdUseCase } from '@src/application/admin/participants/erase-participant-rgpd.usecase';
import { GetAdminParticipantDetailUseCase } from '@src/application/admin/participants/get-admin-participant-detail.usecase';
import { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import { ListAdminParticipantsUseCase } from '@src/application/admin/participants/list-admin-participants.usecase';
import { ListParticipantInvitationTokensUseCase } from '@src/application/admin/participants/list-participant-invitation-tokens.usecase';
import { UpdateAdminParticipantUseCase } from '@src/application/admin/participants/update-admin-participant.usecase';
import { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import { type IInviteUrlConfigPort, INVITE_URL_CONFIG_PORT_SYMBOL } from '@src/interfaces/admin/IInviteUrlConfig.port';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
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
    type IParticipantsWriterPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesSubmissionReaderPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { AuditModule } from '@src/presentation/audit/audit.module';

import { GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL } from '@src/presentation/participant-session/participant.tokens';

import { AdminParticipantsController } from './admin-participants.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
    ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
    GET_ADMIN_PARTICIPANT_DETAIL_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
    UPDATE_ADMIN_PARTICIPANT_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule, AuditModule],
    controllers: [AdminParticipantsController],
    exports: [IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL],
    providers: [
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
            useFactory: (participants: IParticipantsWriterPort & IParticipantsAdminReadPort) =>
                new EraseParticipantRgpdUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_ADMIN_PARTICIPANT_DETAIL_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsAdminReadPort) =>
                new GetAdminParticipantDetailUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: UPDATE_ADMIN_PARTICIPANT_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort & IParticipantsAdminReadPort
            ) => new UpdateAdminParticipantUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (
                participants: IParticipantsIdentityReaderPort & IParticipantsAdminReadPort,
                responses: IResponsesSubmissionReaderPort
            ) => new GetParticipantQuestionnaireMatrixUseCase({ participants, responses }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
    ],
})
export class AdminParticipantsModule {}
