// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { GetAdminDashboardUseCase } from '@src/application/admin/dashboard/get-admin-dashboard.usecase';
import type { GetAdminMailStatusUseCase } from '@src/application/admin/mail/get-admin-mail-status.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { adminDashboardToJson } from './admin.presenters';
import { GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL, GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL } from './admin.tokens';

@ApiTags('admin-management')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminManagementController {
    public constructor(
        @Inject(GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL)
        private readonly getAdminDashboard: GetAdminDashboardUseCase,
        @Inject(GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL)
        private readonly getAdminMailStatus: GetAdminMailStatusUseCase
    ) {}

    @Get('dashboard')
    public async dashboard() {
        const snapshot = await this.getAdminDashboard.execute();
        return adminDashboardToJson(snapshot);
    }

    @Get('mail/status')
    public mailStatus() {
        return this.getAdminMailStatus.execute();
    }
}
