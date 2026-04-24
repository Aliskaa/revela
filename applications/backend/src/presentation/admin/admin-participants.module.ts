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

import { CreateParticipantInviteUseCase } from '@src/application/admin/participants/create-participant-invite.usecase';
import { EraseParticipantRgpdUseCase } from '@src/application/admin/participants/erase-participant-rgpd.usecase';
import { ImportParticipantsCsvUseCase } from '@src/application/admin/participants/import-participants-csv.usecase';
import { ListAdminParticipantsUseCase } from '@src/application/admin/participants/list-admin-participants.usecase';
import { ListParticipantInvitationTokensUseCase } from '@src/application/admin/participants/list-participant-invitation-tokens.usecase';
import { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant/get-participant-questionnaire-matrix.usecase';
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
import { type IInviteUrlConfigPort, INVITE_URL_CONFIG_PORT_SYMBOL } from '@src/interfaces/admin/IInviteUrlConfig.port';
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

import { AdminParticipantsController } from './admin-participants.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    CREATE_PARTICIPANT_INVITE_USE_CASE_SYMBOL,
    ERASE_PARTICIPANT_RGPD_USE_CASE_SYMBOL,
    GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
    IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_PARTICIPANTS_USE_CASE_SYMBOL,
    LIST_PARTICIPANT_INVITATION_TOKENS_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminParticipantsController],
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
            useFactory: (participants: IParticipantsWriterPort) =>
                new EraseParticipantRgpdUseCase({ participants }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL,
            useFactory: (participants: IParticipantsIdentityReaderPort, responses: IResponsesSubmissionReaderPort) =>
                new GetParticipantQuestionnaireMatrixUseCase({ participants, responses }),
            inject: [PARTICIPANTS_REPOSITORY_PORT_SYMBOL, RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
    ],
})
export class AdminParticipantsModule {}
