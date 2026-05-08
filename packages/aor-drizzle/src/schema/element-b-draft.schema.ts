import { integer, jsonb, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { campaignsTable } from './campaign.schema';
import { participantsTable } from './participant.schema';

/**
 * Brouillon de réponses pour le questionnaire Élément Humain (B/F/S).
 * Sauvegardé côté serveur quand le participant termine la première série (54 réponses)
 * pour survivre à un rechargement, une déconnexion ou un changement d'appareil avant
 * la soumission finale. Sur soumission finale (création d'un `questionnaire_response`
 * de kind `element_humain`), le brouillon est supprimé.
 */
export const elementBDraftsTable = pgTable(
    'element_b_drafts',
    {
        id: serial('id').primaryKey(),
        participantId: integer('participant_id')
            .notNull()
            .references(() => participantsTable.id, { onDelete: 'cascade' }),
        campaignId: integer('campaign_id')
            .notNull()
            .references(() => campaignsTable.id, { onDelete: 'cascade' }),
        questionnaireId: varchar('questionnaire_id', { length: 4 }).notNull(),
        series0: jsonb('series0').$type<number[]>(),
        series1: jsonb('series1').$type<number[]>(),
        lastSavedAt: timestamp('last_saved_at', { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    },
    table => [
        uniqueIndex('element_b_drafts_unique_per_participant_campaign_questionnaire').on(
            table.participantId,
            table.campaignId,
            table.questionnaireId
        ),
    ]
);
