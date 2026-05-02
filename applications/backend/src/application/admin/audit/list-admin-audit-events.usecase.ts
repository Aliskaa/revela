// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    AuditEventListItem,
    IAuditEventsRepositoryPort,
} from '@src/interfaces/audit/IAuditEventsRepository.port';
import type { Paginated } from '@src/shared/pagination';

export class ListAdminAuditEventsUseCase {
    public constructor(private readonly ports: { readonly auditEvents: IAuditEventsRepositoryPort }) {}

    public async execute(params: { page?: number; perPage?: number }): Promise<Paginated<AuditEventListItem>> {
        return this.ports.auditEvents.list({
            page: params.page ?? 1,
            perPage: params.perPage ?? 50,
        });
    }
}
