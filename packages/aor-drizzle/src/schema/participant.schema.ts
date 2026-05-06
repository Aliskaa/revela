import { index, integer, pgEnum, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

import { coachesTable } from './coach.schema';
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
        /**
         * Coach qui a créé ce participant via un ajout unitaire (drawer fiche entreprise ou
         * fiche campagne). `null` quand créé par admin (import CSV, bootstrap) ou via un coach
         * désormais supprimé. Sert au contrôle d'accès suppression : un coach ne peut effacer
         * que les participants qu'il a lui-même ajoutés (cf. PDF AOR §coach delete).
         */
        createdByCoachId: integer('created_by_coach_id').references(() => coachesTable.id, {
            onDelete: 'set null',
        }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        index('participants_email_idx').on(table.email),
        index('participants_created_by_coach_idx').on(table.createdByCoachId),
    ]
);
