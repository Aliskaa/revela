// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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

import { Response, type ResponseScore } from '@src/domain/responses';
import type {
    CreateResponseOptions,
    IResponsesRepositoryPort,
    ListResponsesParams,
} from '@src/interfaces/responses/IResponsesRepository.port';
import type { Paginated } from '@src/shared/pagination';

type QuestionnaireResponseRow = typeof questionnaireResponsesTable.$inferSelect;

const attachScoresAndHydrate = async (db: DrizzleDb, rows: QuestionnaireResponseRow[]): Promise<Response[]> => {
    if (rows.length === 0) {
        return [];
    }
    const ids = rows.map(r => r.id);
    const scoreRows = await db.select().from(scoresTable).where(inArray(scoresTable.responseId, ids));
    const byResponse = new Map<number, ResponseScore[]>();
    for (const row of scoreRows) {
        const list = byResponse.get(row.responseId) ?? [];
        list.push({ scoreKey: row.scoreKey, value: row.value });
        byResponse.set(row.responseId, list);
    }
    return rows.map(row =>
        Response.hydrate({
            id: row.id,
            participantId: row.participantId,
            inviteTokenId: row.inviteTokenId,
            questionnaireId: row.questionnaireId,
            campaignId: row.campaignId,
            submissionKind: row.submissionKind,
            subjectParticipantId: row.subjectParticipantId,
            raterParticipantId: row.raterParticipantId,
            ratedParticipantId: row.ratedParticipantId,
            name: row.name,
            email: row.email,
            organisation: row.organisation,
            submittedAt: row.submittedAt,
            scores: byResponse.get(row.id) ?? [],
        })
    );
};

@Injectable()
export class DrizzleResponsesRepository implements IResponsesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listForSubjectQuestionnaireMatrix(
        subjectParticipantId: number,
        questionnaireId: string,
        campaignId?: number
    ): Promise<Response[]> {
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
        return attachScoresAndHydrate(this.db, rows);
    }

    public async listAllInvolvingParticipant(participantId: number): Promise<Response[]> {
        const rows = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(
                or(
                    eq(questionnaireResponsesTable.participantId, participantId),
                    eq(questionnaireResponsesTable.subjectParticipantId, participantId),
                    eq(questionnaireResponsesTable.raterParticipantId, participantId),
                    eq(questionnaireResponsesTable.ratedParticipantId, participantId)
                )
            )
            .orderBy(desc(questionnaireResponsesTable.submittedAt));
        return attachScoresAndHydrate(this.db, rows);
    }

    public async findById(id: number): Promise<Response | null> {
        const [row] = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.id, id))
            .limit(1);
        if (!row) {
            return null;
        }
        const [withScores] = await attachScoresAndHydrate(this.db, [row]);
        return withScores;
    }

    public async create(response: Response, options?: CreateResponseOptions): Promise<Response> {
        const snap = response.persistenceSnapshot();
        return this.db.transaction(async tx => {
            const [inserted] = await tx
                .insert(questionnaireResponsesTable)
                .values({
                    participantId: snap.participantId,
                    inviteTokenId: snap.inviteTokenId,
                    questionnaireId: snap.questionnaireId,
                    campaignId: snap.campaignId,
                    submissionKind: snap.submissionKind,
                    subjectParticipantId: snap.subjectParticipantId,
                    raterParticipantId: snap.raterParticipantId,
                    ratedParticipantId: snap.ratedParticipantId,
                    name: snap.name,
                    email: snap.email,
                    organisation: snap.organisation,
                })
                .returning();

            if (snap.campaignId !== null && snap.participantId !== null) {
                const now = new Date();
                await tx
                    .insert(campaignParticipantsTable)
                    .values({
                        campaignId: snap.campaignId,
                        participantId: snap.participantId,
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
                            eq(participantProgressTable.campaignId, snap.campaignId),
                            eq(participantProgressTable.participantId, snap.participantId)
                        )
                    )
                    .limit(1);
                const [campaign] = await tx
                    .select({
                        allowTestWithoutManualInputs: campaignsTable.allowTestWithoutManualInputs,
                    })
                    .from(campaignsTable)
                    .where(eq(campaignsTable.id, snap.campaignId))
                    .limit(1);
                const canSkipManualInputs = campaign?.allowTestWithoutManualInputs === true;

                const selfDoneAfter =
                    snap.submissionKind === 'self_rating' ? true : existingProgress?.selfRatingStatus === 'completed';
                const peerDoneAfter =
                    snap.submissionKind === 'peer_rating' ? true : existingProgress?.peerFeedbackStatus === 'completed';
                const unlockElementHumain =
                    (snap.submissionKind === 'self_rating' || snap.submissionKind === 'peer_rating') &&
                    (existingProgress?.elementHumainStatus ?? 'locked') === 'locked' &&
                    (canSkipManualInputs || (selfDoneAfter && peerDoneAfter));

                const elementHumainUnlockPatch = unlockElementHumain ? { elementHumainStatus: 'pending' as const } : {};

                const progressPatch =
                    snap.submissionKind === 'self_rating'
                        ? {
                              selfRatingStatus: 'completed' as const,
                              selfRatingCompletedAt: now,
                              updatedAt: now,
                              ...elementHumainUnlockPatch,
                          }
                        : snap.submissionKind === 'peer_rating'
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
                        campaignId: snap.campaignId,
                        participantId: snap.participantId,
                        ...progressPatch,
                    })
                    .onConflictDoUpdate({
                        target: [participantProgressTable.campaignId, participantProgressTable.participantId],
                        set: progressPatch,
                    });
            }

            const insertedScores =
                snap.scores.length === 0
                    ? []
                    : await tx
                          .insert(scoresTable)
                          .values(
                              snap.scores.map(score => ({
                                  responseId: inserted.id,
                                  ...score,
                              }))
                          )
                          .returning();

            if (options?.markInviteTokenUsedId !== undefined) {
                await tx
                    .update(inviteTokensTable)
                    .set({ usedAt: new Date() })
                    .where(eq(inviteTokensTable.id, options.markInviteTokenUsedId));
            }

            return Response.hydrate({
                id: inserted.id,
                participantId: inserted.participantId,
                inviteTokenId: inserted.inviteTokenId,
                questionnaireId: inserted.questionnaireId,
                campaignId: inserted.campaignId,
                submissionKind: inserted.submissionKind,
                subjectParticipantId: inserted.subjectParticipantId,
                raterParticipantId: inserted.raterParticipantId,
                ratedParticipantId: inserted.ratedParticipantId,
                name: inserted.name,
                email: inserted.email,
                organisation: inserted.organisation,
                submittedAt: inserted.submittedAt,
                scores: insertedScores.map(s => ({ scoreKey: s.scoreKey, value: s.value })),
            });
        });
    }

    public async list(params: ListResponsesParams): Promise<Paginated<Response>> {
        const perPage = Math.min(params.perPage, 200);
        const page = Math.max(params.page, 1);
        const filters: SQL[] = [];
        if (params.questionnaireId) {
            filters.push(eq(questionnaireResponsesTable.questionnaireId, params.questionnaireId));
        }
        if (params.campaignId !== undefined) {
            filters.push(eq(questionnaireResponsesTable.campaignId, params.campaignId));
        }
        if (params.coachId !== undefined) {
            // Restreint aux réponses des campagnes attribuées à ce coach (scope=coach).
            // Le sous-select reste plus simple qu'un INNER JOIN ici (campaign_id peut être null
            // pour des réponses historiques non rattachées, qu'on exclut donc implicitement).
            const coachCampaignIds = this.db
                .select({ id: campaignsTable.id })
                .from(campaignsTable)
                .where(eq(campaignsTable.coachId, params.coachId));
            filters.push(inArray(questionnaireResponsesTable.campaignId, coachCampaignIds));
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

        const items = await attachScoresAndHydrate(this.db, rows);
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

    public async listAllForQuestionnaire(questionnaireId: string): Promise<Response[]> {
        const rows = await this.db
            .select()
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.questionnaireId, questionnaireId))
            .orderBy(desc(questionnaireResponsesTable.submittedAt));
        return attachScoresAndHydrate(this.db, rows);
    }

    public async listAnonymizedForCompany(questionnaireId: string, companyId: number): Promise<Response[]> {
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
        return attachScoresAndHydrate(this.db, list);
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
