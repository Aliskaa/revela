// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, auditEventsTable, desc, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    AuditEventListItem,
    IAuditEventsRepositoryPort,
    RecordAuditEventInput,
} from '@src/interfaces/audit/IAuditEventsRepository.port';
import type { Paginated } from '@src/shared/pagination';

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

    public async list(params: { page: number; perPage: number }): Promise<Paginated<AuditEventListItem>> {
        const perPage = Math.min(Math.max(params.perPage, 1), 200);
        const page = Math.max(params.page, 1);

        const [{ total }] = await this.db
            .select({ total: sql<number>`cast(count(*) as int)` })
            .from(auditEventsTable);

        const rows = await this.db
            .select()
            .from(auditEventsTable)
            .orderBy(desc(auditEventsTable.createdAt))
            .limit(perPage)
            .offset((page - 1) * perPage);

        return {
            items: rows.map(r => ({
                id: r.id,
                actorType: r.actorType,
                actorId: r.actorId,
                action: r.action,
                resourceType: r.resourceType,
                resourceId: r.resourceId,
                payload: (r.payload as Record<string, unknown> | null) ?? null,
                ipAddress: r.ipAddress,
                createdAt: r.createdAt,
            })),
            total,
            page,
            pages: Math.max(1, Math.ceil(total / perPage)),
            perPage,
        };
    }
}
