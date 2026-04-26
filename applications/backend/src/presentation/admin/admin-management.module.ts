// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { GetAdminDashboardUseCase } from '@src/application/admin/dashboard/get-admin-dashboard.usecase';
import { GetAdminMailStatusUseCase } from '@src/application/admin/mail/get-admin-mail-status.usecase';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import { type IMailPort, MAIL_PORT_SYMBOL } from '@src/interfaces/invitations/IMail.port';
import {
    type IParticipantsMetricsPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import {
    type IResponsesMetricsPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { AdminManagementController } from './admin-management.controller';
import { AdminSharedModule } from './admin-shared.module';
import { GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL, GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL } from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminManagementController],
    providers: [
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
            provide: GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL,
            useFactory: (mail: IMailPort) => new GetAdminMailStatusUseCase({ mail }),
            inject: [MAIL_PORT_SYMBOL],
        },
    ],
})
export class AdminManagementModule {}
