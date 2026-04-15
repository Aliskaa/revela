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

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Req, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';

import type { CreateAdminCoachUseCase } from '@src/application/admin/coaches/create-admin-coach.usecase';
import type { DeleteAdminCoachUseCase } from '@src/application/admin/coaches/delete-admin-coach.usecase';
import type { GetAdminCoachDetailUseCase } from '@src/application/admin/coaches/get-admin-coach-detail.usecase';
import type { ListAdminCoachesUseCase } from '@src/application/admin/coaches/list-admin-coaches.usecase';
import type { UpdateAdminCoachUseCase } from '@src/application/admin/coaches/update-admin-coach.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { adminCoachDetailToJson } from './admin.presenters';
import {
    CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
    DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
    GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
    LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
} from './admin.tokens';
import type { JwtValidatedUser } from './jwt.strategy';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminCoachesController {
    public constructor(
        @Inject(LIST_ADMIN_COACHES_USE_CASE_SYMBOL)
        private readonly listAdminCoaches: ListAdminCoachesUseCase,
        @Inject(CREATE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly createAdminCoach: CreateAdminCoachUseCase,
        @Inject(GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCoachDetail: GetAdminCoachDetailUseCase,
        @Inject(UPDATE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly updateAdminCoach: UpdateAdminCoachUseCase,
        @Inject(DELETE_ADMIN_COACH_USE_CASE_SYMBOL)
        private readonly deleteAdminCoach: DeleteAdminCoachUseCase
    ) {}

    private ensureCoachEntityAccess(coachId: number, user: JwtValidatedUser): void {
        if (user.scope !== 'coach') {
            return;
        }
        if (user.coachId !== coachId) {
            throw new UnauthorizedException();
        }
    }

    @Get('coaches')
    public async listCoaches(@Req() req: { user: JwtValidatedUser }) {
        const rows = await this.listAdminCoaches.execute();
        const visibleRows = req.user.scope === 'coach' ? rows.filter(row => row.id === req.user.coachId) : rows;
        return visibleRows.map(({ password: _password, ...rest }) => rest);
    }

    @Post('coaches')
    public async createCoach(
        @Req() req: { user: JwtValidatedUser },
        @Body() body: { username?: string; password?: string; display_name?: string }
    ) {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        const coach = await this.createAdminCoach.execute(body);
        const { password: _password, ...safeCoach } = coach;
        return safeCoach;
    }

    @Get('coaches/:coachId')
    public async getCoach(@Param('coachId', ParseIntPipe) coachId: number, @Req() req: { user: JwtValidatedUser }) {
        this.ensureCoachEntityAccess(coachId, req.user);
        const detail = await this.getAdminCoachDetail.execute(coachId);
        return adminCoachDetailToJson(detail);
    }

    @Patch('coaches/:coachId')
    public async updateCoach(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser },
        @Body() body: { username?: string; password?: string; display_name?: string; is_active?: boolean }
    ) {
        this.ensureCoachEntityAccess(coachId, req.user);
        return this.updateAdminCoach.execute(coachId, body);
    }

    @Delete('coaches/:coachId')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteCoach(
        @Param('coachId', ParseIntPipe) coachId: number,
        @Req() req: { user: JwtValidatedUser }
    ): Promise<void> {
        if (req.user.scope === 'coach') {
            throw new UnauthorizedException();
        }
        await this.deleteAdminCoach.execute(coachId);
    }
}
