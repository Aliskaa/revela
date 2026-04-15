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

import { Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';

import type { GetAdminDashboardUseCase } from '@src/application/admin/dashboard/get-admin-dashboard.usecase';
import type { GetAdminMailStatusUseCase } from '@src/application/admin/mail/get-admin-mail-status.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { adminDashboardToJson } from './admin.presenters';
import {
    GET_ADMIN_DASHBOARD_USE_CASE_SYMBOL,
    GET_ADMIN_MAIL_STATUS_USE_CASE_SYMBOL,
} from './admin.tokens';

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
