import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DATABASE_POOL_SYMBOL = Symbol('DATABASE_POOL_SYMBOL');

export const DRIZZLE_DB_SYMBOL = Symbol('DRIZZLE_DB_SYMBOL');

const defaultConnectionString = 'postgres://postgres:postgres@localhost:5432/questionnaire_platform';

export type DrizzleDb = ReturnType<typeof drizzle>;
export type DatabasePool = Pool;

export const createDatabasePool = (): Pool =>
    new Pool({ connectionString: process.env.DATABASE_URL ?? defaultConnectionString });

export const createDrizzleDb = (pool: Pool): DrizzleDb => drizzle(pool);
