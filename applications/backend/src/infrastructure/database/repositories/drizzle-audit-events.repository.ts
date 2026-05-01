// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, auditEventsTable } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    IAuditEventsRepositoryPort,
    RecordAuditEventInput,
} from '@src/interfaces/audit/IAuditEventsRepository.port';

@Injectable()
export class DrizzleAuditEventsRepository implements IAuditEventsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async record(input: RecordAuditEventInput): Promise<void> {
        await this.db.insert(auditEventsTable).values({
            actorType: input.actorType,
            actorId: input.actorId,
            action: input.action,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            payload: input.payload,
            ipAddress: input.ipAddress,
        });
    }
}
