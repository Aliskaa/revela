// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { DeleteAdminResponseUseCase } from '@src/application/admin/responses/delete-admin-response.usecase';
import { ExportAdminAnonymizedResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-anonymized-responses-csv.usecase';
import { ExportAdminResponsesCsvUseCase } from '@src/application/admin/responses/export-admin-responses-csv.usecase';
import { ListAdminResponsesUseCase } from '@src/application/admin/responses/list-admin-responses.usecase';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import {
    type IResponsesAdminListPort,
    type IResponsesExportPort,
    type IResponsesWriterPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { ResponsesModule } from '@src/presentation/responses/responses.module';

import { AdminCampaignsModule } from './admin-campaigns.module';
import { AdminResponsesController } from './admin-responses.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    DELETE_ADMIN_RESPONSE_USE_CASE_SYMBOL,
    EXPORT_ADMIN_ANONYMIZED_RESPONSES_CSV_USE_CASE_SYMBOL,
    EXPORT_ADMIN_RESPONSES_CSV_USE_CASE_SYMBOL,
    LIST_ADMIN_RESPONSES_USE_CASE_SYMBOL,
} from './admin.tokens';

/**
 * `AdminCampaignsModule` est importé pour exposer `GET_ADMIN_CAMPAIGN_DETAIL` que le contrôleur
 * `AdminResponsesController` consomme. `ResponsesModule` fournit `GET_PUBLIC_RESPONSE`.
 */
@Module({
    imports: [AdminSharedModule, AdminCampaignsModule, ResponsesModule],
    controllers: [AdminResponsesController],
    providers: [
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
    ],
})
export class AdminResponsesModule {}
