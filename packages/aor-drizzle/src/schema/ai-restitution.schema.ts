import {
    boolean,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
    varchar,
} from 'drizzle-orm/pg-core';

import { campaignsTable } from './campaign.schema';
import { coachesTable } from './coach.schema';
import { participantsTable } from './participant.schema';

/**
 * Statuts du cycle de vie d'une restitution IA — cf. PDF Marius §3 / §10.
 *
 * - `generated` : la sortie LLM a passé le validateur §9. Visible côté coach uniquement.
 * - `edited`    : le coach a modifié le Markdown. La validation est rejouée à l'édition.
 * - `approved`  : le coach a validé. Diffusé au participant (Niveau 3 résultats).
 * - `rejected`  : sortie inutilisable (validation échouée 2× ou décision coach).
 *                 Pas affichée au participant.
 *
 * Décision 2026-05-10 : pas de statut `draft` séparé en V1 (la création unique
 * passe par `Generate` qui crée directement en `generated` ou `rejected`).
 */
export const aiRestitutionStatusEnum = pgEnum('ai_restitution_status', [
    'generated',
    'edited',
    'approved',
    'rejected',
]);

/**
 * Versions du prompt système §7. Chaque génération est tracée vers la version
 * active au moment de l'appel (cf. §12 — version prompt obligatoire au journal).
 *
 * `forbidden_phrases` et `hypothesis_markers` sont versionnés AVEC le prompt
 * pour qu'on puisse rejouer un audit sur une restitution ancienne.
 */
export const aiPromptVersionsTable = pgTable(
    'ai_prompt_versions',
    {
        id: serial('id').primaryKey(),
        version: varchar('version', { length: 64 }).notNull(),
        systemPrompt: text('system_prompt').notNull(),
        forbiddenPhrases: jsonb('forbidden_phrases').$type<string[]>().notNull(),
        hypothesisMarkers: jsonb('hypothesis_markers').$type<string[]>().notNull(),
        maxWords: integer('max_words').notNull().default(650),
        // Provider et modèle pilotés depuis l'UI Settings Admin (cf. décision Laurent
        // 2026-05-10 : tout paramètre métier en BDD, jamais en `.env`). `provider`
        // sélectionne l'adapter LLM côté backend (`anthropic`, `fake`, …) ;
        // `model` est passé tel quel à l'adapter (`claude-opus-4-7`, etc.).
        provider: varchar('provider', { length: 32 }).notNull().default('anthropic'),
        model: varchar('model', { length: 64 }).notNull().default('claude-opus-4-7'),
        isActive: boolean('is_active').notNull().default(false),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    table => [
        unique('ai_prompt_versions_version_unique').on(table.version),
        index('ai_prompt_versions_is_active_idx').on(table.isActive),
    ]
);

/**
 * Une restitution IA par couple (participant, campagne) en V1.
 *
 * `intermediate_json` stocke l'objet §6 effectivement transmis au modèle —
 * indispensable pour rejouer un audit (réponse à : « pourquoi le modèle a
 * commenté ces dimensions et pas d'autres ? »).
 *
 * `raw_output` = sortie brute du LLM avant édition coach.
 * `edited_output` = version coach (Markdown). Si `null`, on diffuse `raw_output`.
 * `validation_report` = échecs §9 sur la dernière version validée (raw OU edited).
 *
 * `approved_at` / `approved_by_coach_id` ne sont remplis qu'au passage en
 * `status='approved'` (cf. ApproveAiRestitutionUseCase).
 */
export const aiRestitutionsTable = pgTable(
    'ai_restitutions',
    {
        id: serial('id').primaryKey(),
        participantId: integer('participant_id')
            .notNull()
            .references(() => participantsTable.id, { onDelete: 'cascade' }),
        campaignId: integer('campaign_id')
            .notNull()
            .references(() => campaignsTable.id, { onDelete: 'cascade' }),
        status: aiRestitutionStatusEnum('status').notNull().default('generated'),
        model: varchar('model', { length: 64 }).notNull(),
        promptVersionId: integer('prompt_version_id')
            .notNull()
            .references(() => aiPromptVersionsTable.id, { onDelete: 'restrict' }),
        intermediateJson: jsonb('intermediate_json').notNull(),
        rawOutput: text('raw_output').notNull(),
        editedOutput: text('edited_output'),
        validationReport: jsonb('validation_report'),
        regenAttempts: integer('regen_attempts').notNull().default(0),
        generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
        approvedAt: timestamp('approved_at', { withTimezone: true }),
        approvedByCoachId: integer('approved_by_coach_id').references(() => coachesTable.id, {
            onDelete: 'set null',
        }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    table => [
        unique('ai_restitutions_unique_per_participant_campaign').on(
            table.participantId,
            table.campaignId
        ),
        index('ai_restitutions_campaign_id_idx').on(table.campaignId),
        index('ai_restitutions_status_idx').on(table.status),
    ]
);
