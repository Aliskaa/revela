import { boolean, index, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

export const coachesTable = pgTable(
    'coaches',
    {
        id: serial('id').primaryKey(),
        username: varchar('username', { length: 64 }).notNull(),
        /** Scrypt hash (see backend `hashPassword`); legacy rows may store plaintext until rotated. */
        password: varchar('password', { length: 255 }).notNull(),
        displayName: varchar('display_name', { length: 255 }).notNull(),
        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    table => [
        unique('coaches_username_unique').on(table.username),
        index('coaches_username_idx').on(table.username),
    ]
);
