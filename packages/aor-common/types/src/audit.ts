import { z } from 'zod';

export const auditActorTypeSchema = z.enum(['super-admin', 'coach', 'participant', 'system', 'anonymous']);
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export const adminAuditEventSchema = z.object({
    id: z.number().int(),
    actor_type: auditActorTypeSchema,
    actor_id: z.number().int().nullable(),
    /** Slug `<scope>.<resource>.<verb>` ou `<scope>.<verb>` (cf. backend audit-event.schema). */
    action: z.string(),
    resource_type: z.string().nullable(),
    resource_id: z.number().int().nullable(),
    /** JSON libre — jamais de PII brute. */
    payload: z.record(z.string(), z.unknown()).nullable(),
    ip_address: z.string().nullable(),
    /** ISO timestamp. */
    created_at: z.string(),
});
export type AdminAuditEvent = z.infer<typeof adminAuditEventSchema>;
