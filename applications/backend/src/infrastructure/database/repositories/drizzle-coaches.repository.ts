// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, asc, coachesTable, eq, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { Coach } from '@src/domain/coaches';
import type { ICoachesRepositoryPort } from '@src/interfaces/coaches/ICoachesRepository.port';

type CoachRow = {
    id: number;
    username: string;
    password: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date | null;
};

const SELECT_COLUMNS = {
    id: coachesTable.id,
    username: coachesTable.username,
    password: coachesTable.password,
    displayName: coachesTable.displayName,
    isActive: coachesTable.isActive,
    createdAt: coachesTable.createdAt,
} as const;

const hydrateCoach = (row: CoachRow): Coach =>
    Coach.hydrate({
        id: row.id,
        username: row.username,
        passwordHash: row.password,
        displayName: row.displayName,
        isActive: row.isActive,
        createdAt: row.createdAt,
    });

@Injectable()
export class DrizzleCoachesRepository implements ICoachesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listAll(): Promise<Coach[]> {
        const rows = await this.db.select(SELECT_COLUMNS).from(coachesTable).orderBy(asc(coachesTable.displayName));
        return rows.map(hydrateCoach);
    }

    public async findById(id: number): Promise<Coach | null> {
        const [row] = await this.db.select(SELECT_COLUMNS).from(coachesTable).where(eq(coachesTable.id, id)).limit(1);
        return row ? hydrateCoach(row) : null;
    }

    public async findByUsername(username: string): Promise<Coach | null> {
        const [row] = await this.db
            .select(SELECT_COLUMNS)
            .from(coachesTable)
            .where(eq(coachesTable.username, username))
            .limit(1);
        return row ? hydrateCoach(row) : null;
    }

    public async create(coach: Coach): Promise<Coach> {
        const snap = coach.persistenceSnapshot();
        const [row] = await this.db
            .insert(coachesTable)
            .values({
                username: snap.username,
                password: snap.passwordHash,
                displayName: snap.displayName,
                isActive: snap.isActive,
            })
            .returning(SELECT_COLUMNS);
        return hydrateCoach(row);
    }

    public async save(coach: Coach): Promise<Coach | null> {
        if (!coach.isPersisted()) {
            throw new Error('Cannot save() a non-persisted Coach. Use create() instead.');
        }
        const snap = coach.persistenceSnapshot();
        const [row] = await this.db
            .update(coachesTable)
            .set({
                username: snap.username,
                password: snap.passwordHash,
                displayName: snap.displayName,
                isActive: snap.isActive,
                updatedAt: sql`now()`,
            })
            .where(eq(coachesTable.id, snap.id))
            .returning(SELECT_COLUMNS);
        return row ? hydrateCoach(row) : null;
    }

    public async deleteById(id: number): Promise<void> {
        await this.db.delete(coachesTable).where(eq(coachesTable.id, id));
    }
}
