// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { ListAdminAuditEventsUseCase } from '@src/application/admin/audit/list-admin-audit-events.usecase';
import {
    AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL,
    type IAuditEventsRepositoryPort,
} from '@src/interfaces/audit/IAuditEventsRepository.port';

import { AuditModule } from '@src/presentation/audit/audit.module';

import { AdminAuditController } from './admin-audit.controller';
import { AdminSharedModule } from './admin-shared.module';
import { LIST_ADMIN_AUDIT_EVENTS_USE_CASE_SYMBOL } from './admin.tokens';

@Module({
    imports: [AdminSharedModule, AuditModule],
    controllers: [AdminAuditController],
    providers: [
        {
            provide: LIST_ADMIN_AUDIT_EVENTS_USE_CASE_SYMBOL,
            useFactory: (auditEvents: IAuditEventsRepositoryPort) =>
                new ListAdminAuditEventsUseCase({ auditEvents }),
            inject: [AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL],
        },
    ],
})
export class AdminAuditModule {}
