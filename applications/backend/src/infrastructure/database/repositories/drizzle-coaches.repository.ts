import { DRIZZLE_DB_SYMBOL, type DrizzleDb, asc, coachesTable, eq, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    CoachRecord,
    ICoachesRepositoryPort,
    UpdateCoachCommand,
} from '@src/interfaces/coaches/ICoachesRepository.port';

@Injectable()
export class DrizzleCoachesRepository implements ICoachesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listAll(): Promise<CoachRecord[]> {
        return this.db
            .select({
                id: coachesTable.id,
                username: coachesTable.username,
                password: coachesTable.password,
                displayName: coachesTable.displayName,
                isActive: coachesTable.isActive,
                createdAt: coachesTable.createdAt,
            })
            .from(coachesTable)
            .orderBy(asc(coachesTable.displayName));
    }

    public async findById(id: number): Promise<CoachRecord | null> {
        const [coach] = await this.db
            .select({
                id: coachesTable.id,
                username: coachesTable.username,
                password: coachesTable.password,
                displayName: coachesTable.displayName,
                isActive: coachesTable.isActive,
                createdAt: coachesTable.createdAt,
            })
            .from(coachesTable)
            .where(eq(coachesTable.id, id))
            .limit(1);
        return coach ?? null;
    }

    public async findByUsername(username: string): Promise<CoachRecord | null> {
        const [coach] = await this.db
            .select({
                id: coachesTable.id,
                username: coachesTable.username,
                password: coachesTable.password,
                displayName: coachesTable.displayName,
                isActive: coachesTable.isActive,
                createdAt: coachesTable.createdAt,
            })
            .from(coachesTable)
            .where(eq(coachesTable.username, username))
            .limit(1);
        return coach ?? null;
    }

    public async create(input: { username: string; password: string; displayName: string }): Promise<CoachRecord> {
        const [created] = await this.db
            .insert(coachesTable)
            .values({
                username: input.username,
                password: input.password,
                displayName: input.displayName,
            })
            .returning({
                id: coachesTable.id,
                username: coachesTable.username,
                password: coachesTable.password,
                displayName: coachesTable.displayName,
                isActive: coachesTable.isActive,
                createdAt: coachesTable.createdAt,
            });
        return created;
    }

    public async update(id: number, command: UpdateCoachCommand): Promise<CoachRecord | null> {
        const [updated] = await this.db
            .update(coachesTable)
            .set({
                ...(command.username !== undefined ? { username: command.username } : {}),
                ...(command.password !== undefined ? { password: command.password } : {}),
                ...(command.displayName !== undefined ? { displayName: command.displayName } : {}),
                ...(command.isActive !== undefined ? { isActive: command.isActive } : {}),
                updatedAt: sql`now()`,
            })
            .where(eq(coachesTable.id, id))
            .returning({
                id: coachesTable.id,
                username: coachesTable.username,
                password: coachesTable.password,
                displayName: coachesTable.displayName,
                isActive: coachesTable.isActive,
                createdAt: coachesTable.createdAt,
            });
        return updated ?? null;
    }

    public async deleteById(id: number): Promise<void> {
        await this.db.delete(coachesTable).where(eq(coachesTable.id, id));
    }
}
