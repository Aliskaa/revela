export {
    createDatabasePool,
    createDrizzleDb,
    DATABASE_POOL_SYMBOL,
    DRIZZLE_DB_SYMBOL,
    type DatabasePool,
    type DrizzleDb,
} from './client';

// Re-export Drizzle operators/types so repositories consume the same module instance
// as the tables defined inside this package (prevents pnpm multi-install type conflicts).
export * from 'drizzle-orm';

export * from './schema/company.schema';
export * from './schema/coach.schema';
export * from './schema/campaign.schema';
export * from './schema/invite-token.schema';
export * from './schema/participant.schema';
export * from './schema/questionnaire-response.schema';
export * from './schema/refresh-token.schema';
export * from './schema/score.schema';
