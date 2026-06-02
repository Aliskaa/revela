// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Controller, Get, Inject, Query, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { ListAdminAuditEventsUseCase } from '@src/application/admin/audit/list-admin-audit-events.usecase';
import { CurrentUser } from '@src/presentation/current-user.decorator';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { type PaginationParams, PaginationQueryPipe } from '@src/presentation/pagination-query.pipe';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { auditEventToAdminJson } from './admin.presenters';
import { LIST_ADMIN_AUDIT_EVENTS_USE_CASE_SYMBOL } from './admin.tokens';

@ApiTags('admin-audit')
@ApiBearerAuth('jwt')
@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
@UseFilters(AdminApplicationExceptionFilter, ResponsesExceptionFilter)
export class AdminAuditController {
    public constructor(
        @Inject(LIST_ADMIN_AUDIT_EVENTS_USE_CASE_SYMBOL)
        private readonly listAdminAuditEvents: ListAdminAuditEventsUseCase
    ) {}

    /**
     * Audit log (G6 RGPD). Accès super-admin uniquement — un coach ne doit pas voir
     * les actions des autres coaches ni des super-admins.
     */
    @Get('audit-events')
    @ApiOperation({ summary: 'Liste paginée du journal d’audit (G6 RGPD, super-admin uniquement).' })
    public async listAuditEvents(
        @CurrentUser() user: JwtValidatedUser,
        @Query(PaginationQueryPipe) { page, perPage }: PaginationParams
    ) {
        if (user.scope !== 'super-admin') {
            throw new UnauthorizedException();
        }
        const result = await this.listAdminAuditEvents.execute({ page, perPage });
        return {
            items: result.items.map(auditEventToAdminJson),
            total: result.total,
            page: result.page,
            pages: result.pages,
            per_page: result.perPage,
        };
    }
}
