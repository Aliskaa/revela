/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import {
    DRIZZLE_DB_SYMBOL,
    type DrizzleDb,
    campaignParticipantsTable,
    campaignsTable,
    inviteTokensTable,
    participantProgressTable,
    participantsTable,
    questionnaireResponsesTable,
    scoresTable,
} from '@aor/drizzle';
import { type SQL, and, asc, desc, eq, inArray, isNull, or, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    CreateResponseCommand,
    IResponsesRepositoryPort,
    ListResponsesParams,
    ResponseRecord,
    ResponseScoreRecord,
    UpdateResponseCommand,
} from '@src/interfaces/responses/IResponsesRepository.port';
import type { Paginated } from '@src/shared/pagination';

type QuestionnaireResponseRow = typeof questionnaireResponsesTable.$inferSelect;

const attachScores = async (db: DrizzleDb, rows: QuestionnaireResponseRow[]): Promise<ResponseRecord[]> => {
    if (rows.length === 0) {
        return [];
    }
    const ids = rows.map(r => r.id);
    const scoreRows = await db.select().from(scoresTable).where(inArray(scoresTable.responseId, ids));
    const byResponse = new Map<number, ResponseScoreRecord[]>();
    for (const row of scoreRows) {
        const list = byResponse.get(row.responseId) ?? [];
        list.push({ scoreKey: row.scoreKey, value: row.value });
        byResponse.set(row.responseId, list);
    }
    return rows.map(row => ({
        ...row,
        scores: byResponse.get(row.id) ?? [],
    }));
};

@Injectable()
export class DrizzleResponsesRepository implements IResponsesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listForSubjectQuestionnaireMatrix(
        subjectParticipantId: number,
        questionnaireId: string,
        campaignId?: number
    ): Promise<ResponseRecord[]> {
        const qid = questionnaireId.toUpperCase();
        const subjectMatch = or(
            eq(questionnaireResponsesTable.subjectParticipantId, subjectParticipantId),
            and(
                eq(questionnaireResponsesTable.submissionKind, 'element_humain'),
                isNull(questionnaireResponsesTable.subjectParticipantId),
                eq(questionnaireResponsesTable.participantId, subjectParticipantId)
            )
        );
        const rows = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(
                and(
                    eq(questionnaireResponsesTable.questionnaireId, qid),
                    subjectMatch,
                    campaignId === undefined ? undefined : eq(questionnaireResponsesTable.campaignId, campaignId)
                )
            )
            .orderBy(desc(questionnaireResponsesTable.submittedAt));
        return attachScores(this.db, rows);
    }

    public async findById(id: number): Promise<ResponseRecord | null> {
        const [response] = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.id, id))
            .limit(1);
        if (!response) {
            return null;
        }
        const [withScores] = await attachScores(this.db, [response]);
        return withScores;
    }

    public async create(command: CreateResponseCommand): Promise<ResponseRecord> {
        return this.db.transaction(async tx => {
            const [response] = await tx
                .insert(questionnaireResponsesTable)
                .values({
                    participantId: command.participantId ?? null,
                    inviteTokenId: command.inviteTokenId ?? null,
                    questionnaireId: command.questionnaireId,
                    campaignId: command.campaignId ?? null,
                    submissionKind: command.submissionKind ?? 'element_humain',
                    subjectParticipantId: command.subjectParticipantId ?? null,
                    raterParticipantId: command.raterParticipantId ?? null,
                    ratedParticipantId: command.ratedParticipantId ?? null,
                    name: command.name,
                    email: command.email,
                    organisation: command.organisation ?? null,
                })
                .returning();

            if (command.campaignId !== undefined && command.participantId !== undefined) {
                const now = new Date();
                await tx
                    .insert(campaignParticipantsTable)
                    .values({
                        campaignId: command.campaignId,
                        participantId: command.participantId,
                        invitedAt: now,
                        updatedAt: now,
                    })
                    .onConflictDoUpdate({
                        target: [campaignParticipantsTable.campaignId, campaignParticipantsTable.participantId],
                        set: {
                            invitedAt: sql`coalesce(${campaignParticipantsTable.invitedAt}, ${now})`,
                            updatedAt: now,
                        },
                    });

                const [existingProgress] = await tx
                    .select({
                        selfRatingStatus: participantProgressTable.selfRatingStatus,
                        peerFeedbackStatus: participantProgressTable.peerFeedbackStatus,
                        elementHumainStatus: participantProgressTable.elementHumainStatus,
                    })
                    .from(participantProgressTable)
                    .where(
                        and(
                            eq(participantProgressTable.campaignId, command.campaignId),
                            eq(participantProgressTable.participantId, command.participantId)
                        )
                    )
                    .limit(1);
                const [campaign] = await tx
                    .select({
                        allowTestWithoutManualInputs: campaignsTable.allowTestWithoutManualInputs,
                    })
                    .from(campaignsTable)
                    .where(eq(campaignsTable.id, command.campaignId))
                    .limit(1);
                const canSkipManualInputs = campaign?.allowTestWithoutManualInputs === true;

                const selfDoneAfter =
                    command.submissionKind === 'self_rating'
                        ? true
                        : existingProgress?.selfRatingStatus === 'completed';
                const peerDoneAfter =
                    command.submissionKind === 'peer_rating'
                        ? true
                        : existingProgress?.peerFeedbackStatus === 'completed';
                const unlockElementHumain =
                    (command.submissionKind === 'self_rating' || command.submissionKind === 'peer_rating') &&
                    (existingProgress?.elementHumainStatus ?? 'locked') === 'locked' &&
                    (canSkipManualInputs || (selfDoneAfter && peerDoneAfter));

                const elementHumainUnlockPatch = unlockElementHumain ? { elementHumainStatus: 'pending' as const } : {};

                const progressPatch =
                    command.submissionKind === 'self_rating'
                        ? {
                              selfRatingStatus: 'completed' as const,
                              selfRatingCompletedAt: now,
                              updatedAt: now,
                              ...elementHumainUnlockPatch,
                          }
                        : command.submissionKind === 'peer_rating'
                          ? {
                                peerFeedbackStatus: 'completed' as const,
                                peerFeedbackCompletedAt: now,
                                updatedAt: now,
                                ...elementHumainUnlockPatch,
                            }
                          : {
                                elementHumainStatus: 'completed' as const,
                                elementHumainCompletedAt: now,
                                updatedAt: now,
                            };

                await tx
                    .insert(participantProgressTable)
                    .values({
                        campaignId: command.campaignId,
                        participantId: command.participantId,
                        ...progressPatch,
                    })
                    .onConflictDoUpdate({
                        target: [participantProgressTable.campaignId, participantProgressTable.participantId],
                        set: progressPatch,
                    });
            }

            const scores =
                command.scores.length === 0
                    ? []
                    : await tx
                          .insert(scoresTable)
                          .values(
                              command.scores.map(score => ({
                                  responseId: response.id,
                                  ...score,
                              }))
                          )
                          .returning();

            if (command.markInviteTokenUsedId !== undefined) {
                await tx
                    .update(inviteTokensTable)
                    .set({ usedAt: new Date() })
                    .where(eq(inviteTokensTable.id, command.markInviteTokenUsedId));
            }

            return {
                ...response,
                scores,
            };
        });
    }

    public async update(command: UpdateResponseCommand): Promise<ResponseRecord | null> {
        return this.db.transaction(async tx => {
            const [existing] = await tx
                .select()
                .from(questionnaireResponsesTable)
                .where(eq(questionnaireResponsesTable.id, command.id))
                .limit(1);
            if (!existing) {
                return null;
            }

            const [updated] = await tx
                .update(questionnaireResponsesTable)
                .set({
                    name: command.name,
                    email: command.email,
                    organisation: command.organisation ?? null,
                    submittedAt: new Date(),
                })
                .where(eq(questionnaireResponsesTable.id, command.id))
                .returning();

            await tx.delete(scoresTable).where(eq(scoresTable.responseId, command.id));

            const scores =
                command.scores.length === 0
                    ? []
                    : await tx
                          .insert(scoresTable)
                          .values(
                              command.scores.map(score => ({
                                  responseId: command.id,
                                  ...score,
                              }))
                          )
                          .returning();

            return {
                ...updated,
                scores,
            };
        });
    }

    public async list(params: ListResponsesParams): Promise<Paginated<ResponseRecord>> {
        const perPage = Math.min(params.perPage, 200);
        const page = Math.max(params.page, 1);
        const filters: SQL[] = [];
        if (params.questionnaireId) {
            filters.push(eq(questionnaireResponsesTable.questionnaireId, params.questionnaireId));
        }
        if (params.campaignId !== undefined) {
            filters.push(eq(questionnaireResponsesTable.campaignId, params.campaignId));
        }
        const whereClause: SQL | undefined = filters.length > 0 ? and(...filters) : undefined;

        const countQuery = this.db
            .select({ total: sql<number>`cast(count(*) as int)` })
            .from(questionnaireResponsesTable);
        const [{ total }] = whereClause ? await countQuery.where(whereClause) : await countQuery;

        const listQuery = this.db.select().from(questionnaireResponsesTable);
        const rows = whereClause
            ? await listQuery
                  .where(whereClause)
                  .orderBy(desc(questionnaireResponsesTable.submittedAt))
                  .limit(perPage)
                  .offset((page - 1) * perPage)
            : await listQuery
                  .orderBy(desc(questionnaireResponsesTable.submittedAt))
                  .limit(perPage)
                  .offset((page - 1) * perPage);

        const items = await attachScores(this.db, rows);
        return {
            items,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / perPage)),
            perPage,
        };
    }

    public async deleteById(id: number): Promise<boolean> {
        return this.db.transaction(async tx => {
            const [existing] = await tx
                .select({ id: questionnaireResponsesTable.id })
                .from(questionnaireResponsesTable)
                .where(eq(questionnaireResponsesTable.id, id))
                .limit(1);
            if (!existing) {
                return false;
            }
            await tx.delete(scoresTable).where(eq(scoresTable.responseId, id));
            await tx.delete(questionnaireResponsesTable).where(eq(questionnaireResponsesTable.id, id));
            return true;
        });
    }

    public async listAllForQuestionnaire(questionnaireId: string): Promise<ResponseRecord[]> {
        const rows = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.questionnaireId, questionnaireId))
            .orderBy(desc(questionnaireResponsesTable.submittedAt));
        return attachScores(this.db, rows);
    }

    public async listAnonymizedForCompany(questionnaireId: string, companyId: number): Promise<ResponseRecord[]> {
        const rows = await this.db
            .select({ response: questionnaireResponsesTable })
            .from(questionnaireResponsesTable)
            .innerJoin(participantsTable, eq(questionnaireResponsesTable.participantId, participantsTable.id))
            .where(
                and(
                    eq(questionnaireResponsesTable.questionnaireId, questionnaireId),
                    eq(participantsTable.companyId, companyId)
                )
            )
            .orderBy(asc(questionnaireResponsesTable.submittedAt));

        const list = rows.map(r => r.response);
        return attachScores(this.db, list);
    }

    public async countAll(): Promise<number> {
        const [{ total }] = await this.db
            .select({ total: sql<number>`cast(count(*) as int)` })
            .from(questionnaireResponsesTable);
        return total;
    }

    public async countByQuestionnaire(questionnaireId: string): Promise<number> {
        const [{ total }] = await this.db
            .select({ total: sql<number>`cast(count(*) as int)` })
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.questionnaireId, questionnaireId));
        return total;
    }

    public async findLatestSubmittedAt(questionnaireId: string): Promise<Date | null> {
        const [row] = await this.db
            .select({ submittedAt: questionnaireResponsesTable.submittedAt })
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.questionnaireId, questionnaireId))
            .orderBy(desc(questionnaireResponsesTable.submittedAt))
            .limit(1);
        return row?.submittedAt ?? null;
    }
}
