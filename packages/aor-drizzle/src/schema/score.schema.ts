import { index, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';

import { questionnaireResponsesTable } from './questionnaire-response.schema';

export const scoresTable = pgTable(
    'scores',
    {
        id: serial('id').primaryKey(),
        responseId: integer('response_id')
            .notNull()
            .references(() => questionnaireResponsesTable.id),
        scoreKey: integer('score_key').notNull(),
        value: integer('value').notNull(),
    },
    table => [
        index('scores_response_id_idx').on(table.responseId),
        unique('scores_response_id_score_key_unique').on(table.responseId, table.scoreKey),
    ]
);
