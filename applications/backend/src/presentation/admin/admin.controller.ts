// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Body, Controller, Inject, Post, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import type { AdminAuthUseCase } from '@src/application/admin/auth/admin-auth.usecase';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { ADMIN_AUTH_USE_CASE_SYMBOL } from './admin.tokens';

@ApiTags('admin-auth')
@Controller('admin')
@UseFilters(AdminApplicationExceptionFilter)
export class AdminController {
    public constructor(@Inject(ADMIN_AUTH_USE_CASE_SYMBOL) private readonly adminAuth: AdminAuthUseCase) {}

    @Post('auth/login')
    @ApiOperation({
        summary: 'Authentification admin — super-admin via env vars ou coach via DB. Retourne un JWT.',
    })
    public async login(@Body() body: { username?: string; password?: string }) {
        const username = body.username ?? '';
        const password = body.password ?? '';
        const result = await this.adminAuth.login(username, password);
        return { access_token: result.accessToken };
    }
}
