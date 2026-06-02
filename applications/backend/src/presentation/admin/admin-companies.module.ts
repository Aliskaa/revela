// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { AddParticipantToCompanyUseCase } from '@src/application/admin/companies/add-participant-to-company.usecase';
import { CreateAdminCompanyUseCase } from '@src/application/admin/companies/create-admin-company.usecase';
import { DeleteAdminCompanyUseCase } from '@src/application/admin/companies/delete-admin-company.usecase';
import { GetAdminCompanyAvatarUseCase } from '@src/application/admin/companies/get-admin-company-avatar.usecase';
import { GetAdminCompanyUseCase } from '@src/application/admin/companies/get-admin-company.usecase';
import { ListAdminCompaniesUseCase } from '@src/application/admin/companies/list-admin-companies.usecase';
import { UpdateAdminCompanyUseCase } from '@src/application/admin/companies/update-admin-company.usecase';
import { UploadAdminCompanyAvatarUseCase } from '@src/application/admin/companies/upload-admin-company-avatar.usecase';
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
    type IParticipantsAdminReadPort,
    type IParticipantsIdentityReaderPort,
    type IParticipantsWriterPort,
    PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/participants/IParticipantsRepository.port';

import { AdminCompaniesController } from './admin-companies.controller';
import { AdminParticipantsModule } from './admin-participants.module';
import { AdminSharedModule } from './admin-shared.module';
import {
    ADD_PARTICIPANT_TO_COMPANY_USE_CASE_SYMBOL,
    CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_AVATAR_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
    LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    UPLOAD_ADMIN_COMPANY_AVATAR_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule, AdminParticipantsModule],
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
            provide: GET_ADMIN_COMPANY_AVATAR_USE_CASE_SYMBOL,
            useFactory: (companies: ICompaniesReadPort) => new GetAdminCompanyAvatarUseCase(companies),
            inject: [COMPANIES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: UPLOAD_ADMIN_COMPANY_AVATAR_USE_CASE_SYMBOL,
            useFactory: (companies: ICompaniesReadPort & ICompaniesWritePort) =>
                new UploadAdminCompanyAvatarUseCase(companies),
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
            useFactory: (
                companies: ICompaniesReadPort & ICompaniesWritePort,
                participants: IParticipantsAdminReadPort & IParticipantsWriterPort
            ) => new DeleteAdminCompanyUseCase({ companies, participants }),
            inject: [COMPANIES_REPOSITORY_PORT_SYMBOL, PARTICIPANTS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: ADD_PARTICIPANT_TO_COMPANY_USE_CASE_SYMBOL,
            useFactory: (
                companies: ICompaniesReadPort,
                campaigns: ICampaignsReadPort,
                participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort
            ) => new AddParticipantToCompanyUseCase({ companies, campaigns, participants }),
            inject: [
                COMPANIES_REPOSITORY_PORT_SYMBOL,
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
            ],
        },
    ],
})
export class AdminCompaniesModule {}
