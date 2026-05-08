// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, and, elementBDraftsTable, eq } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    ElementBDraftRecord,
    IElementBDraftsRepositoryPort,
    UpsertElementBDraftInput,
} from '@src/interfaces/responses/IElementBDraftsRepository.port';

const toRecord = (row: typeof elementBDraftsTable.$inferSelect): ElementBDraftRecord => ({
    participantId: row.participantId,
    campaignId: row.campaignId,
    questionnaireId: row.questionnaireId,
    series0: row.series0 ?? null,
    series1: row.series1 ?? null,
    lastSavedAt: row.lastSavedAt,
});

@Injectable()
export class DrizzleElementBDraftsRepository implements IElementBDraftsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByKey(
        participantId: number,
        campaignId: number,
        questionnaireId: string
    ): Promise<ElementBDraftRecord | null> {
        const qid = questionnaireId.toUpperCase();
        const rows = await this.db
            .select()
            .from(elementBDraftsTable)
            .where(
                and(
                    eq(elementBDraftsTable.participantId, participantId),
                    eq(elementBDraftsTable.campaignId, campaignId),
                    eq(elementBDraftsTable.questionnaireId, qid)
                )
            )
            .limit(1);
        const row = rows[0];
        return row ? toRecord(row) : null;
    }

    public async upsert(input: UpsertElementBDraftInput): Promise<ElementBDraftRecord> {
        const qid = input.questionnaireId.toUpperCase();
        const now = new Date();
        const insertValues: typeof elementBDraftsTable.$inferInsert = {
            participantId: input.participantId,
            campaignId: input.campaignId,
            questionnaireId: qid,
            series0: input.series0 === undefined ? null : input.series0,
            series1: input.series1 === undefined ? null : input.series1,
            lastSavedAt: now,
        };
        // Update only the series fields explicitly provided. `undefined` = preserve.
        const updateSet: Partial<typeof elementBDraftsTable.$inferInsert> = { lastSavedAt: now };
        if (input.series0 !== undefined) updateSet.series0 = input.series0;
        if (input.series1 !== undefined) updateSet.series1 = input.series1;

        const [row] = await this.db
            .insert(elementBDraftsTable)
            .values(insertValues)
            .onConflictDoUpdate({
                target: [
                    elementBDraftsTable.participantId,
                    elementBDraftsTable.campaignId,
                    elementBDraftsTable.questionnaireId,
                ],
                set: updateSet,
            })
            .returning();
        return toRecord(row);
    }

    public async deleteByKey(participantId: number, campaignId: number, questionnaireId: string): Promise<boolean> {
        const qid = questionnaireId.toUpperCase();
        const rows = await this.db
            .delete(elementBDraftsTable)
            .where(
                and(
                    eq(elementBDraftsTable.participantId, participantId),
                    eq(elementBDraftsTable.campaignId, campaignId),
                    eq(elementBDraftsTable.questionnaireId, qid)
                )
            )
            .returning({ id: elementBDraftsTable.id });
        return rows.length > 0;
    }
}
