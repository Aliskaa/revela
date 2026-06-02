// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    DRIZZLE_DB_SYMBOL,
    type DrizzleDb,
    aiPromptVersionsTable,
    aiRestitutionsTable,
    and,
    desc,
    eq,
} from '@aor/drizzle';
import type { AiRestitutionValidationReport } from '@aor/types';
import { Inject, Injectable } from '@nestjs/common';

import type {
    AiPromptVersionRecord,
    AiRestitutionRecord,
    CreateAiRestitutionInput,
    IAiRestitutionsRepositoryPort,
    UpdateAiRestitutionInput,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';

const toRecord = (row: typeof aiRestitutionsTable.$inferSelect, promptVersion: string): AiRestitutionRecord => ({
    id: row.id,
    participantId: row.participantId,
    campaignId: row.campaignId,
    status: row.status,
    model: row.model,
    promptVersion,
    promptVersionId: row.promptVersionId,
    intermediateJson: row.intermediateJson,
    rawOutput: row.rawOutput,
    editedOutput: row.editedOutput ?? null,
    validationReport: (row.validationReport as AiRestitutionValidationReport | null) ?? null,
    regenAttempts: row.regenAttempts,
    generatedAt: row.generatedAt,
    approvedAt: row.approvedAt ?? null,
    approvedByCoachId: row.approvedByCoachId ?? null,
    updatedAt: row.updatedAt,
});

const toPromptVersionRecord = (row: typeof aiPromptVersionsTable.$inferSelect): AiPromptVersionRecord => ({
    id: row.id,
    version: row.version,
    systemPrompt: row.systemPrompt,
    forbiddenPhrases: row.forbiddenPhrases,
    hypothesisMarkers: row.hypothesisMarkers,
    maxWords: row.maxWords,
    provider: row.provider,
    model: row.model,
    isActive: row.isActive,
    createdAt: row.createdAt,
});

@Injectable()
export class DrizzleAiRestitutionsRepository implements IAiRestitutionsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByParticipantCampaign(
        participantId: number,
        campaignId: number
    ): Promise<AiRestitutionRecord | null> {
        const rows = await this.db
            .select({
                restitution: aiRestitutionsTable,
                promptVersion: aiPromptVersionsTable.version,
            })
            .from(aiRestitutionsTable)
            .innerJoin(aiPromptVersionsTable, eq(aiPromptVersionsTable.id, aiRestitutionsTable.promptVersionId))
            .where(
                and(
                    eq(aiRestitutionsTable.participantId, participantId),
                    eq(aiRestitutionsTable.campaignId, campaignId)
                )
            )
            .limit(1);
        const row = rows[0];
        return row ? toRecord(row.restitution, row.promptVersion) : null;
    }

    public async findById(id: number): Promise<AiRestitutionRecord | null> {
        const rows = await this.db
            .select({
                restitution: aiRestitutionsTable,
                promptVersion: aiPromptVersionsTable.version,
            })
            .from(aiRestitutionsTable)
            .innerJoin(aiPromptVersionsTable, eq(aiPromptVersionsTable.id, aiRestitutionsTable.promptVersionId))
            .where(eq(aiRestitutionsTable.id, id))
            .limit(1);
        const row = rows[0];
        return row ? toRecord(row.restitution, row.promptVersion) : null;
    }

    public async create(input: CreateAiRestitutionInput): Promise<AiRestitutionRecord> {
        const now = new Date();
        const insertValues: typeof aiRestitutionsTable.$inferInsert = {
            participantId: input.participantId,
            campaignId: input.campaignId,
            status: input.status,
            model: input.model,
            promptVersionId: input.promptVersionId,
            intermediateJson: input.intermediateJson,
            rawOutput: input.rawOutput,
            editedOutput: null,
            validationReport: input.validationReport,
            regenAttempts: 0,
            generatedAt: now,
            approvedAt: null,
            approvedByCoachId: null,
            createdAt: now,
            updatedAt: now,
        };
        // Upsert : on accepte de remplacer une restitution existante (cas où le
        // coach relance Generate après un rejected — comportement attendu).
        const [row] = await this.db
            .insert(aiRestitutionsTable)
            .values(insertValues)
            .onConflictDoUpdate({
                target: [aiRestitutionsTable.participantId, aiRestitutionsTable.campaignId],
                set: {
                    status: input.status,
                    model: input.model,
                    promptVersionId: input.promptVersionId,
                    intermediateJson: input.intermediateJson,
                    rawOutput: input.rawOutput,
                    editedOutput: null,
                    validationReport: input.validationReport,
                    regenAttempts: 0,
                    generatedAt: now,
                    approvedAt: null,
                    approvedByCoachId: null,
                    updatedAt: now,
                },
            })
            .returning();
        if (!row) {
            throw new Error('Insert into ai_restitutions returned no row.');
        }
        const promptVersion = await this.fetchPromptVersionString(row.promptVersionId);
        return toRecord(row, promptVersion);
    }

    public async update(input: UpdateAiRestitutionInput): Promise<AiRestitutionRecord> {
        const now = new Date();
        const updateSet: Partial<typeof aiRestitutionsTable.$inferInsert> = { updatedAt: now };
        if (input.status !== undefined) updateSet.status = input.status;
        if (input.editedOutput !== undefined) updateSet.editedOutput = input.editedOutput;
        if (input.validationReport !== undefined) updateSet.validationReport = input.validationReport;
        if (input.regenAttempts !== undefined) updateSet.regenAttempts = input.regenAttempts;
        if (input.approvedAt !== undefined) updateSet.approvedAt = input.approvedAt;
        if (input.approvedByCoachId !== undefined) updateSet.approvedByCoachId = input.approvedByCoachId;

        const [row] = await this.db
            .update(aiRestitutionsTable)
            .set(updateSet)
            .where(eq(aiRestitutionsTable.id, input.id))
            .returning();
        if (!row) {
            throw new Error(`ai_restitution ${input.id} not found for update.`);
        }
        const promptVersion = await this.fetchPromptVersionString(row.promptVersionId);
        return toRecord(row, promptVersion);
    }

    public async findActivePromptVersion(): Promise<AiPromptVersionRecord | null> {
        const rows = await this.db
            .select()
            .from(aiPromptVersionsTable)
            .where(eq(aiPromptVersionsTable.isActive, true))
            .orderBy(desc(aiPromptVersionsTable.createdAt))
            .limit(1);
        const row = rows[0];
        return row ? toPromptVersionRecord(row) : null;
    }

    private async fetchPromptVersionString(promptVersionId: number): Promise<string> {
        const rows = await this.db
            .select({ version: aiPromptVersionsTable.version })
            .from(aiPromptVersionsTable)
            .where(eq(aiPromptVersionsTable.id, promptVersionId))
            .limit(1);
        const row = rows[0];
        if (!row) {
            throw new Error(`ai_prompt_versions.id=${promptVersionId} not found.`);
        }
        return row.version;
    }
}
