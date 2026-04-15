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

import { Body, Controller, Inject, Post, UseFilters } from '@nestjs/common';

import type { AdminAuthUseCase } from '@src/application/admin/auth/admin-auth.usecase';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { ADMIN_AUTH_USE_CASE_SYMBOL } from './admin.tokens';

@Controller('admin')
@UseFilters(AdminApplicationExceptionFilter)
export class AdminController {
    public constructor(@Inject(ADMIN_AUTH_USE_CASE_SYMBOL) private readonly adminAuth: AdminAuthUseCase) {}

    @Post('auth/login')
    public async login(@Body() body: { username?: string; password?: string }) {
        const username = body.username ?? '';
        const password = body.password ?? '';
        const result = await this.adminAuth.login(username, password);
        return { access_token: result.accessToken };
    }
}
