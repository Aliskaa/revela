import { index, integer, pgEnum, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

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
    ]
);
