// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { CreateAdminCompanyUseCase } from '@src/application/admin/companies/create-admin-company.usecase';
import { DeleteAdminCompanyUseCase } from '@src/application/admin/companies/delete-admin-company.usecase';
import { GetAdminCompanyUseCase } from '@src/application/admin/companies/get-admin-company.usecase';
import { ListAdminCompaniesUseCase } from '@src/application/admin/companies/list-admin-companies.usecase';
import { UpdateAdminCompanyUseCase } from '@src/application/admin/companies/update-admin-company.usecase';
import {
    COMPANIES_REPOSITORY_PORT_SYMBOL,
    type ICompaniesReadPort,
    type ICompaniesWritePort,
} from '@src/interfaces/companies/ICompaniesRepository.port';

import { AdminCompaniesController } from './admin-companies.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
    LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminCompaniesController],
    providers: [
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
            useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) =>
                new CreateAdminCompanyUseCase({ companies }),
            inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
            useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) =>
                new UpdateAdminCompanyUseCase({ companies }),
            inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
            useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) =>
                new DeleteAdminCompanyUseCase({ companies }),
            inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
        },
    ],
})
export class AdminCompaniesModule {}
