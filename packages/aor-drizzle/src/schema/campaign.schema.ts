import { boolean, index, integer, pgEnum, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { coachesTable } from './coach.schema';
import { companiesTable } from './company.schema';
import { participantsTable } from './participant.schema';

export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'closed', 'archived']);

export const participantStepStatusEnum = pgEnum('participant_step_status', ['locked', 'pending', 'completed']);

export const campaignsTable = pgTable(
    'campaigns',
    {
        id: serial('id').primaryKey(),
        coachId: integer('coach_id')
            .notNull()
            .references(() => coachesTable.id, { onDelete: 'restrict' }),
        companyId: integer('company_id')
            .notNull()
            .references(() => companiesTable.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        questionnaireId: varchar('questionnaire_id', { length: 16 }),
        status: campaignStatusEnum('status').notNull().default('draft'),
        allowTestWithoutManualInputs: boolean('allow_test_without_manual_inputs').notNull().default(false),
        startsAt: timestamp('starts_at', { withTimezone: true }),
        endsAt: timestamp('ends_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        unique('campaigns_company_name_unique').on(table.companyId, table.name),
        index('campaigns_coach_id_idx').on(table.coachId),
        index('campaigns_company_id_idx').on(table.companyId),
        index('campaigns_status_idx').on(table.status),
    ]
);

export const campaignParticipantsTable = pgTable(
    'campaign_participants',
    {
        id: serial('id').primaryKey(),
        campaignId: integer('campaign_id')
            .notNull()
            .references(() => campaignsTable.id, { onDelete: 'cascade' }),
        participantId: integer('participant_id')
            .notNull()
            .references(() => participantsTable.id, { onDelete: 'cascade' }),
        invitedAt: timestamp('invited_at', { withTimezone: true }),
        joinedAt: timestamp('joined_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        unique('campaign_participants_unique').on(table.campaignId, table.participantId),
        index('campaign_participants_campaign_id_idx').on(table.campaignId),
        index('campaign_participants_participant_id_idx').on(table.participantId),
    ]
);

export const participantProgressTable = pgTable(
    'participant_progress',
    {
        id: serial('id').primaryKey(),
        campaignId: integer('campaign_id')
            .notNull()
            .references(() => campaignsTable.id, { onDelete: 'cascade' }),
        participantId: integer('participant_id')
            .notNull()
            .references(() => participantsTable.id, { onDelete: 'cascade' }),
        selfRatingStatus: participantStepStatusEnum('self_rating_status').notNull().default('pending'),
        peerFeedbackStatus: participantStepStatusEnum('peer_feedback_status').notNull().default('pending'),
        elementHumainStatus: participantStepStatusEnum('element_humain_status').notNull().default('locked'),
        resultsStatus: participantStepStatusEnum('results_status').notNull().default('locked'),
        selfRatingCompletedAt: timestamp('self_rating_completed_at', { withTimezone: true }),
        peerFeedbackCompletedAt: timestamp('peer_feedback_completed_at', { withTimezone: true }),
        elementHumainCompletedAt: timestamp('element_humain_completed_at', { withTimezone: true }),
        resultsPublishedAt: timestamp('results_published_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        unique('participant_progress_unique').on(table.campaignId, table.participantId),
        index('participant_progress_campaign_id_idx').on(table.campaignId),
        index('participant_progress_participant_id_idx').on(table.participantId),
    ]
);
