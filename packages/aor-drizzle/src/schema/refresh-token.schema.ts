import {
    type AnyPgColumn,
    index,
    integer,
    pgEnum,
    pgTable,
    serial,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

/**
 * Type d'acteur propriétaire du refresh token. `admin` regroupe super-admins ET coachs
 * (ils partagent le même `coachesTable` côté DB et la même chaîne d'auth `apiClient`).
 * `participant` correspond aux participants de campagnes.
 */
export const refreshTokenSubjectEnum = pgEnum('refresh_token_subject_type', ['admin', 'participant']);

export type RefreshTokenSubjectType = (typeof refreshTokenSubjectEnum.enumValues)[number];

/**
 * Refresh tokens (RGPD G1 — auth httpOnly + rotation).
 *
 * Chaque refresh token est :
 *  - **stocké haché** (SHA-256 hex) — on ne sait jamais reconstituer le token en clair en BDD
 *    en cas de fuite de la base ;
 *  - **rotaté à chaque utilisation** : `usedAt` est marqué non-null et un nouveau token est
 *    inséré, lié via `replacedById`. La même `familyId` est conservée pour traçabilité ;
 *  - **détecte la réutilisation** : si un client présente un token dont `usedAt` est non-null,
 *    on considère qu'il y a vol/replay et on revoque **toute la famille** (`revokedAt = now`
 *    sur tous les tokens partageant la même `familyId`).
 *
 * Référence : OWASP Auth Cheat Sheet — "Token rotation with reuse detection".
 */
export const refreshTokensTable = pgTable(
    'refresh_tokens',
    {
        id: serial('id').primaryKey(),
        subjectType: refreshTokenSubjectEnum('subject_type').notNull(),
        subjectId: integer('subject_id').notNull(),
        /** SHA-256 hex du token brut (64 caractères). Unique (lookup direct). */
        tokenHash: varchar('token_hash', { length: 64 }).notNull(),
        /** UUID de la chaîne de rotation. Tous les tokens issus du même login partagent une famille. */
        familyId: varchar('family_id', { length: 36 }).notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        /** Marqué quand le token est consommé pour rotation. Réutilisation = vol → revoke famille. */
        usedAt: timestamp('used_at', { withTimezone: true }),
        /** Token de remplacement émis lors de la rotation (FK self-reference). */
        replacedById: integer('replaced_by_id').references((): AnyPgColumn => refreshTokensTable.id, {
            onDelete: 'set null',
        }),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    table => [
        uniqueIndex('refresh_tokens_token_hash_unique').on(table.tokenHash),
        index('refresh_tokens_subject_idx').on(table.subjectType, table.subjectId),
        index('refresh_tokens_family_idx').on(table.familyId),
    ]
);
