// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Controller,
    Get,
    Inject,
    Query,
    Req,
    UnauthorizedException,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { ListAdminAuditEventsUseCase } from '@src/application/admin/audit/list-admin-audit-events.usecase';
import { ResponsesExceptionFilter } from '@src/presentation/responses/responses-exception.filter';

import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';
import { AdminApplicationExceptionFilter } from './admin-application-exception.filter';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
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
    public async listAuditEvents(
        @Req() req: { user: JwtValidatedUser },
        @Query('page') page?: string,
        @Query('per_page') perPage?: string
    ) {
        if (req.user.scope !== 'super-admin') {
            throw new UnauthorizedException();
        }
        const result = await this.listAdminAuditEvents.execute({
            page: page ? Number.parseInt(page, 10) || 1 : 1,
            perPage: perPage ? Number.parseInt(perPage, 10) || 50 : 50,
        });
        return {
            items: result.items.map(item => ({
                id: item.id,
                actor_type: item.actorType,
                actor_id: item.actorId,
                action: item.action,
                resource_type: item.resourceType,
                resource_id: item.resourceId,
                payload: item.payload,
                ip_address: item.ipAddress,
                created_at: item.createdAt,
            })),
            total: result.total,
            page: result.page,
            pages: result.pages,
            per_page: result.perPage,
        };
    }
}
