// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { AuditLoggerService } from '@src/application/audit/audit-logger.service';
import { DrizzleAuditEventsRepository } from '@src/infrastructure/database/repositories/drizzle-audit-events.repository';
import { AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/audit/IAuditEventsRepository.port';

/**
 * Module partagé fournissant le service d'audit (G6 RGPD). À importer dans tout module
 * dont les use cases enregistrent des événements (admin, participant, invitations).
 */
@Module({
    providers: [
        DrizzleAuditEventsRepository,
        { provide: AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL, useExisting: DrizzleAuditEventsRepository },
        AuditLoggerService,
    ],
    exports: [AuditLoggerService, AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL],
})
export class AuditModule {}
