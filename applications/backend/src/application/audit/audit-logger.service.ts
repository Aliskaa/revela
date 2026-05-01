// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createConsoleLogger } from '@aor/logger';
import { Inject, Injectable } from '@nestjs/common';

import {
    AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL,
    type AuditActorType,
    type IAuditEventsRepositoryPort,
} from '@src/interfaces/audit/IAuditEventsRepository.port';

const log = createConsoleLogger({ context: 'AuditLogger' });

export type AuditLogInput = {
    actorType: AuditActorType;
    actorId: number | null;
    action: string;
    resourceType?: string | null;
    resourceId?: number | null;
    payload?: Record<string, unknown> | null;
    ipAddress?: string | null;
};

/**
 * Service injectable pour enregistrer un événement d'audit (G6 RGPD).
 *
 * Conçu pour être appelé en "fire-and-forget" depuis les use cases sensibles : un échec
 * d'écriture dans `audit_events` n'interrompt pas la requête principale (on ne veut pas
 * qu'un bug d'audit empêche un login légitime ou bloque une suppression RGPD demandée).
 * Les erreurs sont juste loguées au logger console — un monitoring externe les remonte
 * en cas d'incident.
 *
 * **Ne jamais inclure de PII brute** dans `payload` : pas de mot de passe, pas de contenu
 * de réponse, pas d'email en clair (les IDs suffisent pour la réconciliation au moment
 * de l'audit).
 */
@Injectable()
export class AuditLoggerService {
    public constructor(
        @Inject(AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL)
        private readonly repo: IAuditEventsRepositoryPort
    ) {}

    public async record(input: AuditLogInput): Promise<void> {
        try {
            await this.repo.record({
                actorType: input.actorType,
                actorId: input.actorId,
                action: input.action,
                resourceType: input.resourceType ?? null,
                resourceId: input.resourceId ?? null,
                payload: input.payload ?? null,
                ipAddress: input.ipAddress ?? null,
            });
        } catch (err) {
            log.error('Échec d’écriture d’un événement d’audit', {
                action: input.action,
                actorType: input.actorType,
                actorId: input.actorId,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
}
