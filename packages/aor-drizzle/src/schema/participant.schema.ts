import { index, integer, pgEnum, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { companiesTable } from './company.schema';

export const participantFunctionLevelEnum = pgEnum('participant_function_level', [
    'direction',
    'middle_management',
    'frontline_manager',
]);

export const participantsTable = pgTable(
    'participants',
    {
        id: serial('id').primaryKey(),
        companyId: integer('company_id').references(() => companiesTable.id),
        firstName: varchar('first_name', { length: 255 }).notNull(),
        lastName: varchar('last_name', { length: 255 }).notNull(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        organisation: varchar('organisation', { length: 255 }),
        direction: varchar('direction', { length: 255 }),
        service: varchar('service', { length: 255 }),
        functionLevel: participantFunctionLevelEnum('function_level'),
        /** Scrypt hash (see backend `hashPassword`); null until invitation onboarding is completed. */
        passwordHash: varchar('password_hash', { length: 255 }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [index('participants_email_idx').on(table.email)]
);
