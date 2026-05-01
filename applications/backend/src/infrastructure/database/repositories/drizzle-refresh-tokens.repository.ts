// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, eq, refreshTokensTable } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';
import { and, isNull, sql } from 'drizzle-orm';

import type {
    CreateRefreshTokenInput,
    IRefreshTokensRepositoryPort,
    RefreshTokenRecord,
    RefreshTokenSubjectType,
} from '@src/interfaces/auth/IRefreshTokensRepository.port';

type Row = typeof refreshTokensTable.$inferSelect;

const toRecord = (row: Row): RefreshTokenRecord => ({
    id: row.id,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    replacedById: row.replacedById,
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
});

@Injectable()
export class DrizzleRefreshTokensRepository implements IRefreshTokensRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
        const [row] = await this.db
            .insert(refreshTokensTable)
            .values({
                subjectType: input.subjectType,
                subjectId: input.subjectId,
                tokenHash: input.tokenHash,
                familyId: input.familyId,
                expiresAt: input.expiresAt,
            })
            .returning();
        return toRecord(row);
    }

    public async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
        const [row] = await this.db
            .select()
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.tokenHash, tokenHash))
            .limit(1);
        return row ? toRecord(row) : null;
    }

    public async markUsed(tokenId: number, replacedById: number, usedAt: Date): Promise<void> {
        await this.db
            .update(refreshTokensTable)
            .set({ usedAt, replacedById })
            .where(and(eq(refreshTokensTable.id, tokenId), isNull(refreshTokensTable.usedAt)));
    }

    public async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
        await this.db
            .update(refreshTokensTable)
            .set({ revokedAt })
            .where(and(eq(refreshTokensTable.familyId, familyId), isNull(refreshTokensTable.revokedAt)));
    }

    public async revokeAllForSubject(
        subjectType: RefreshTokenSubjectType,
        subjectId: number,
        revokedAt: Date
    ): Promise<void> {
        await this.db
            .update(refreshTokensTable)
            .set({ revokedAt })
            .where(
                and(
                    eq(refreshTokensTable.subjectType, subjectType),
                    eq(refreshTokensTable.subjectId, subjectId),
                    sql`${refreshTokensTable.revokedAt} is null`
                )
            );
    }
}
