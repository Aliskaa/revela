import { sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { campaignsTable } from './campaign.schema';
import { inviteTokensTable } from './invite-token.schema';
import { participantsTable } from './participant.schema';

export const submissionKindEnum = pgEnum('submission_kind', ['element_humain', 'self_rating', 'peer_rating']);

export type SubmissionKind = (typeof submissionKindEnum.enumValues)[number];

export const questionnaireResponsesTable = pgTable(
    'questionnaire_responses',
    {
        id: serial('id').primaryKey(),
        participantId: integer('participant_id').references(() => participantsTable.id),
        inviteTokenId: integer('invite_token_id').references(() => inviteTokensTable.id),
        questionnaireId: varchar('questionnaire_id', { length: 4 }).notNull(),
        campaignId: integer('campaign_id').references(() => campaignsTable.id, { onDelete: 'set null' }),
        submissionKind: submissionKindEnum('submission_kind').notNull().default('element_humain'),
        subjectParticipantId: integer('subject_participant_id').references(() => participantsTable.id),
        raterParticipantId: integer('rater_participant_id').references(() => participantsTable.id),
        ratedParticipantId: integer('rated_participant_id').references(() => participantsTable.id),
        name: varchar('name', { length: 255 }).notNull(),
        email: varchar('email', { length: 255 }).notNull(),
        organisation: varchar('organisation', { length: 255 }),
        submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        index('questionnaire_responses_questionnaire_id_idx').on(table.questionnaireId),
        index('questionnaire_responses_campaign_id_idx').on(table.campaignId),
        index('questionnaire_responses_submission_kind_idx').on(table.submissionKind),
        index('questionnaire_responses_subject_participant_id_idx').on(table.subjectParticipantId),
        index('questionnaire_responses_rater_participant_id_idx').on(table.raterParticipantId),
        index('questionnaire_responses_rated_participant_id_idx').on(table.ratedParticipantId),
        uniqueIndex('questionnaire_responses_unique_self_rating')
            .on(table.campaignId, table.questionnaireId, table.subjectParticipantId)
            .where(
                sql`${table.submissionKind} = 'self_rating' and ${table.campaignId} is not null and ${table.subjectParticipantId} is not null`
            ),
        uniqueIndex('questionnaire_responses_unique_element_humain')
            .on(table.campaignId, table.questionnaireId, table.subjectParticipantId)
            .where(
                sql`${table.submissionKind} = 'element_humain' and ${table.campaignId} is not null and ${table.subjectParticipantId} is not null`
            ),
        uniqueIndex('questionnaire_responses_unique_peer_rating_target')
            .on(table.campaignId, table.questionnaireId, table.subjectParticipantId, table.ratedParticipantId)
            .where(
                sql`${table.submissionKind} = 'peer_rating' and ${table.campaignId} is not null and ${table.subjectParticipantId} is not null and ${table.ratedParticipantId} is not null`
            ),
    ]
);
