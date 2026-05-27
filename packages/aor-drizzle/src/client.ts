import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DATABASE_POOL_SYMBOL = Symbol('DATABASE_POOL_SYMBOL');

export const DRIZZLE_DB_SYMBOL = Symbol('DRIZZLE_DB_SYMBOL');

const defaultConnectionString = 'postgres://postgres:postgres@localhost:5432/questionnaire_platform';

export type DrizzleDb = ReturnType<typeof drizzle>;
export type DatabasePool = Pool;

const DEFAULT_POOL_MAX = 50;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const createDatabasePool = (): Pool =>
    new Pool({
        connectionString: process.env.DATABASE_URL ?? defaultConnectionString,
        max: parsePositiveInt(process.env.DATABASE_POOL_MAX, DEFAULT_POOL_MAX),
        idleTimeoutMillis: parsePositiveInt(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS, DEFAULT_IDLE_TIMEOUT_MS),
        connectionTimeoutMillis: parsePositiveInt(
            process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
            DEFAULT_CONNECTION_TIMEOUT_MS,
        ),
        keepAlive: true,
    });

export const createDrizzleDb = (pool: Pool): DrizzleDb => drizzle(pool);
