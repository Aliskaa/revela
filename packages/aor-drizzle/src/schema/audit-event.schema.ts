import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Type d'acteur à l'origine de l'événement. `super-admin` et `coach` sont distingués
 * car ils ont des `subjectId` différents (env vars vs `coachesTable.id`). `participant`
 * vit dans `participantsTable`. `system` couvre les actions automatiques (cron, migrations).
 * `anonymous` est utilisé pour les tentatives de login échouées sans actor identifié
 * (uniquement IP).
 */
export const auditActorTypeEnum = pgEnum('audit_actor_type', [
    'super-admin',
    'coach',
    'participant',
    'system',
    'anonymous',
]);

export type AuditActorType = (typeof auditActorTypeEnum.enumValues)[number];

/**
 * Audit trail (G6 RGPD — Article 5.1.f, traçabilité). Trace les actions sensibles
 * effectuées sur des données personnelles, ainsi que les événements d'authentification
 * (login, logout, échecs).
 *
 * **Lectures non tracées** en V1 — volume trop important. On trace uniquement :
 *  - Auth : login (succès + échec), logout, token theft detection (revoke famille).
 *  - Modifications RGPD : delete/update participant, delete company, CRUD coach.
 *
 * Le `payload` est un JSON libre (max ~2KB recommandé) pour stocker des contextes
 * complémentaires (ex. champs modifiés, raison de l'échec, IP source). **Jamais de PII
 * brute** (mot de passe, contenu de réponse). Les IDs des ressources suffisent — la
 * réconciliation se fait au moment de l'audit.
 */
export const auditEventsTable = pgTable(
    'audit_events',
    {
        id: serial('id').primaryKey(),
        actorType: auditActorTypeEnum('actor_type').notNull(),
        /**
         * ID de l'acteur (coachId, participantId, ...). `null` pour `system` et
         * `anonymous` (échec login avant identification).
         */
        actorId: integer('actor_id'),
        /**
         * Slug normalisé de l'action : `admin.login.success`, `admin.participant.erase`,
         * `participant.login.failure`, etc. Format : `<scope>.<resource>.<verb>` ou
         * `<scope>.<verb>` pour les actions transverses (login, logout).
         */
        action: text('action').notNull(),
        resourceType: text('resource_type'),
        resourceId: integer('resource_id'),
        /** Contexte JSON libre — champs modifiés, raison d'échec, etc. JAMAIS de PII brute. */
        payload: jsonb('payload'),
        /** IP source (lecture du header `x-forwarded-for` ou de la connexion). Utile pour les login. */
        ipAddress: text('ip_address'),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    table => [
        index('audit_events_actor_idx').on(table.actorType, table.actorId),
        index('audit_events_action_idx').on(table.action),
        index('audit_events_resource_idx').on(table.resourceType, table.resourceId),
        index('audit_events_created_at_idx').on(table.createdAt),
    ]
);

