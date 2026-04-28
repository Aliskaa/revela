// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { CreateAdminCompanyUseCase } from '@src/application/admin/companies/create-admin-company.usecase';
import type { DeleteAdminCompanyUseCase } from '@src/application/admin/companies/delete-admin-company.usecase';
import type { GetAdminCompanyUseCase } from '@src/application/admin/companies/get-admin-company.usecase';
import type { ListAdminCompaniesUseCase } from '@src/application/admin/companies/list-admin-companies.usecase';
import type { UpdateAdminCompanyUseCase } from '@src/application/admin/companies/update-admin-company.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { companyToAdminJson } from './admin.presenters';
import type { JwtValidatedUser } from './jwt.strategy';
import {
    CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL,
    GET_ADMIN_COMPANY_USE_CASE_SYMBOL,
    LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL,
} from './admin.tokens';

@ApiTags('admin-companies')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminCompaniesController {
    public constructor(
        @Inject(LIST_ADMIN_COMPANIES_USE_CASE_SYMBOL)
        private readonly listAdminCompanies: ListAdminCompaniesUseCase,
        @Inject(GET_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly getAdminCompany: GetAdminCompanyUseCase,
        @Inject(CREATE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly createAdminCompany: CreateAdminCompanyUseCase,
        @Inject(UPDATE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly updateAdminCompany: UpdateAdminCompanyUseCase,
        @Inject(DELETE_ADMIN_COMPANY_USE_CASE_SYMBOL)
        private readonly deleteAdminCompany: DeleteAdminCompanyUseCase
    ) {}

    @Get('companies')
    public async listCompanies(@Req() req: { user: JwtValidatedUser }) {
        const coachId = req.user.scope === 'coach' ? req.user.coachId : undefined;
        const rows = await this.listAdminCompanies.execute({ coachId });
        return rows.map(companyToAdminJson);
    }

    @Get('companies/:companyId')
    public async getCompany(@Param('companyId', ParseIntPipe) companyId: number) {
        const row = await this.getAdminCompany.execute(companyId);
        return companyToAdminJson(row);
    }

    @Post('companies')
    public async createCompany(
        @Body() body: { name?: string; contact_name?: string | null; contact_email?: string | null }
    ) {
        const row = await this.createAdminCompany.execute(body);
        return companyToAdminJson(row);
    }

    @Patch('companies/:companyId')
    public async updateCompany(
        @Param('companyId', ParseIntPipe) companyId: number,
        @Body() body: { name?: string; contact_name?: string | null; contact_email?: string | null }
    ) {
        const row = await this.updateAdminCompany.execute(companyId, body);
        return companyToAdminJson(row);
    }

    @Delete('companies/:companyId')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteCompany(@Param('companyId', ParseIntPipe) companyId: number): Promise<void> {
        await this.deleteAdminCompany.execute(companyId);
    }
}
