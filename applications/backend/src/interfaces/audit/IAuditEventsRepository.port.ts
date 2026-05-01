// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL = Symbol('AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL');

export type AuditActorType = 'super-admin' | 'coach' | 'participant' | 'system' | 'anonymous';

export type RecordAuditEventInput = {
    actorType: AuditActorType;
    actorId: number | null;
    /** Slug normalisé : `<scope>.<resource>.<verb>` ou `<scope>.<verb>` (cf. schema). */
    action: string;
    resourceType: string | null;
    resourceId: number | null;
    /** Payload JSON libre — JAMAIS de PII brute (mdp, contenu de réponse). */
    payload: Record<string, unknown> | null;
    ipAddress: string | null;
};

export interface IAuditEventsRepositoryPort {
    record(input: RecordAuditEventInput): Promise<void>;
}
