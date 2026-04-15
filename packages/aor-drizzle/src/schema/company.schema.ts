import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const companiesTable = pgTable('companies', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
