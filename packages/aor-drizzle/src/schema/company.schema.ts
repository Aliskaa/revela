import { customType, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

const pgBytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
    dataType: () => 'bytea',
    fromDriver: value => (Buffer.isBuffer(value) ? value : Buffer.from(value)),
    toDriver: value => value,
});

export const companiesTable = pgTable('companies', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    contactName: varchar('contact_name', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    /** Données binaires du logo (JPEG, PNG ou WebP). Null si aucun logo. */
    avatarData: pgBytea('avatar_data'),
    /** Type MIME du logo (`image/jpeg`, `image/png`, `image/webp`). */
    avatarMimeType: varchar('avatar_mime_type', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
