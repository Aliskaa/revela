import { boolean, index, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { campaignsTable } from './campaign.schema';
import { participantsTable } from './participant.schema';

export const inviteTokensTable = pgTable(
    'invite_tokens',
    {
        id: serial('id').primaryKey(),
        token: varchar('token', { length: 64 }).notNull().unique(),
        participantId: integer('participant_id')
            .notNull()
            .references(() => participantsTable.id),
        campaignId: integer('campaign_id').references(() => campaignsTable.id, { onDelete: 'set null' }),
        questionnaireId: varchar('questionnaire_id', { length: 4 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        usedAt: timestamp('used_at', { withTimezone: true }),
        isActive: boolean('is_active').notNull().default(true),
    },
    table => [
        index('invite_tokens_token_idx').on(table.token),
        index('invite_tokens_campaign_id_idx').on(table.campaignId),
    ]
);
