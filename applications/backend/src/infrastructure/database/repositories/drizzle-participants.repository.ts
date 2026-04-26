// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    DRIZZLE_DB_SYMBOL,
    type DrizzleDb,
    and,
    asc,
    campaignParticipantsTable,
    companiesTable,
    desc,
    eq,
    inArray,
    inviteTokensTable,
    isNotNull,
    ne,
    participantProgressTable,
    participantsTable,
    questionnaireResponsesTable,
    scoresTable,
    sql,
} from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { invitationTokenAdminStatus } from '@aor/domain';
import { Participant, type ParticipantFunctionLevel } from '@src/domain/participants';
import type {
    CampaignParticipantInviteState,
    CampaignParticipantProgressItem,
    CampaignPeerChoiceItemDto,
    IParticipantsRepositoryPort,
    ListParticipantsParams,
    ParticipantAdminListItem,
    ParticipantInviteAssignment,
    ParticipantProgressRecord,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { Paginated } from '@src/shared/pagination';

type ParticipantRow = {
    id: number;
    companyId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    organisation: string | null;
    direction: string | null;
    service: string | null;
    functionLevel: ParticipantFunctionLevel | null;
    passwordHash: string | null;
    createdAt: Date | null;
};

const hydrateParticipant = (row: ParticipantRow): Participant =>
    Participant.hydrate({
        id: row.id,
        companyId: row.companyId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        organisation: row.organisation,
        direction: row.direction,
        service: row.service,
        functionLevel: row.functionLevel,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
    });

@Injectable()
export class DrizzleParticipantsRepository implements IParticipantsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async countAll(): Promise<number> {
        const [{ total }] = await this.db.select({ total: sql<number>`cast(count(*) as int)` }).from(participantsTable);
        return total;
    }

    public async findByEmail(email: string): Promise<Participant | null> {
        const [row] = await this.db
            .select()
            .from(participantsTable)
            .where(eq(participantsTable.email, email.toLowerCase()))
            .limit(1);
        return row ? hydrateParticipant(row) : null;
    }

    public async findById(id: number): Promise<Participant | null> {
        const [row] = await this.db.select().from(participantsTable).where(eq(participantsTable.id, id)).limit(1);
        return row ? hydrateParticipant(row) : null;
    }

    public async listQuestionnaireIdsFromInvitesForParticipant(participantId: number): Promise<string[]> {
        const rows = await this.db
            .select({
                questionnaireId: inviteTokensTable.questionnaireId,
                createdAt: inviteTokensTable.createdAt,
                usedAt: inviteTokensTable.usedAt,
            })
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, participantId));

        const lastActivityByQid = new Map<string, number>();
        for (const row of rows) {
            const created = row.createdAt?.getTime() ?? 0;
            const used = row.usedAt?.getTime() ?? 0;
            const last = Math.max(created, used);
            const qid = row.questionnaireId;
            const prev = lastActivityByQid.get(qid) ?? 0;
            lastActivityByQid.set(qid, Math.max(prev, last));
        }
        return [...lastActivityByQid.entries()].sort((a, b) => b[1] - a[1]).map(([qid]) => qid);
    }

    public async listInviteAssignmentsForParticipant(participantId: number): Promise<ParticipantInviteAssignment[]> {
        const inviteRows = await this.db
            .select({
                campaignId: inviteTokensTable.campaignId,
                questionnaireId: inviteTokensTable.questionnaireId,
                createdAt: inviteTokensTable.createdAt,
                usedAt: inviteTokensTable.usedAt,
            })
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, participantId));

        const responseRows = await this.db
            .select({
                campaignId: questionnaireResponsesTable.campaignId,
                questionnaireId: questionnaireResponsesTable.questionnaireId,
                createdAt: questionnaireResponsesTable.submittedAt,
                usedAt: questionnaireResponsesTable.submittedAt,
            })
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.participantId, participantId));

        const rows = [...inviteRows, ...responseRows];
        const lastActivityByAssignment = new Map<
            string,
            { campaignId: number | null; questionnaireId: string; at: number }
        >();
        for (const row of rows) {
            const created = row.createdAt?.getTime() ?? 0;
            const used = row.usedAt?.getTime() ?? 0;
            const at = Math.max(created, used);
            const key = `${String(row.campaignId)}::${row.questionnaireId}`;
            const prev = lastActivityByAssignment.get(key);
            if (!prev || at > prev.at) {
                lastActivityByAssignment.set(key, {
                    campaignId: row.campaignId,
                    questionnaireId: row.questionnaireId,
                    at,
                });
            }
        }

        return [...lastActivityByAssignment.values()]
            .sort((a, b) => b.at - a.at)
            .map(({ campaignId, questionnaireId }) => ({ campaignId, questionnaireId }));
    }

    public async ensureCampaignParticipantInvited(campaignId: number, participantId: number): Promise<void> {
        const now = new Date();
        await this.db
            .insert(campaignParticipantsTable)
            .values({
                campaignId,
                participantId,
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
    }

    public async confirmCampaignParticipantParticipation(campaignId: number, participantId: number): Promise<void> {
        const now = new Date();
        await this.db
            .insert(campaignParticipantsTable)
            .values({
                campaignId,
                participantId,
                invitedAt: now,
                joinedAt: now,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: [campaignParticipantsTable.campaignId, campaignParticipantsTable.participantId],
                set: {
                    invitedAt: sql`coalesce(${campaignParticipantsTable.invitedAt}, ${now})`,
                    joinedAt: sql`coalesce(${campaignParticipantsTable.joinedAt}, ${now})`,
                    updatedAt: now,
                },
            });
    }

    public async listCampaignIdsWithConfirmedParticipation(participantId: number): Promise<number[]> {
        const rows = await this.db
            .select({ campaignId: campaignParticipantsTable.campaignId })
            .from(campaignParticipantsTable)
            .where(
                and(
                    eq(campaignParticipantsTable.participantId, participantId),
                    isNotNull(campaignParticipantsTable.joinedAt)
                )
            );
        return rows.map(r => r.campaignId);
    }

    public async getCampaignParticipantInviteState(
        campaignId: number,
        participantId: number
    ): Promise<CampaignParticipantInviteState | null> {
        const [row] = await this.db
            .select({
                invitedAt: campaignParticipantsTable.invitedAt,
                joinedAt: campaignParticipantsTable.joinedAt,
            })
            .from(campaignParticipantsTable)
            .where(
                and(
                    eq(campaignParticipantsTable.campaignId, campaignId),
                    eq(campaignParticipantsTable.participantId, participantId)
                )
            )
            .limit(1);
        return row ?? null;
    }

    public async getLatestInviteAssignmentForParticipant(
        participantId: number
    ): Promise<ParticipantInviteAssignment | null> {
        const [assignment] = await this.db
            .select({
                campaignId: inviteTokensTable.campaignId,
                questionnaireId: inviteTokensTable.questionnaireId,
            })
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, participantId))
            .orderBy(desc(inviteTokensTable.createdAt))
            .limit(1);
        return assignment ?? null;
    }

    public async findProgressForCampaignParticipant(
        campaignId: number,
        participantId: number
    ): Promise<ParticipantProgressRecord | null> {
        const [progress] = await this.db
            .select({
                campaignId: participantProgressTable.campaignId,
                participantId: participantProgressTable.participantId,
                selfRatingStatus: participantProgressTable.selfRatingStatus,
                peerFeedbackStatus: participantProgressTable.peerFeedbackStatus,
                elementHumainStatus: participantProgressTable.elementHumainStatus,
                resultsStatus: participantProgressTable.resultsStatus,
            })
            .from(participantProgressTable)
            .where(
                and(
                    eq(participantProgressTable.campaignId, campaignId),
                    eq(participantProgressTable.participantId, participantId)
                )
            )
            .limit(1);
        return progress ?? null;
    }

    public async create(participant: Participant): Promise<Participant> {
        const snap = participant.persistenceSnapshot();
        const [row] = await this.db
            .insert(participantsTable)
            .values({
                companyId: snap.companyId,
                firstName: snap.firstName,
                lastName: snap.lastName,
                email: snap.email.toLowerCase(),
                organisation: snap.organisation,
                direction: snap.direction,
                service: snap.service,
                functionLevel: snap.functionLevel,
                passwordHash: snap.passwordHash,
            })
            .returning();
        return hydrateParticipant(row);
    }

    public async save(participant: Participant): Promise<Participant | null> {
        if (!participant.isPersisted()) {
            throw new Error('Cannot save() a non-persisted Participant. Use create() instead.');
        }
        const snap = participant.persistenceSnapshot();
        const [row] = await this.db
            .update(participantsTable)
            .set({
                companyId: snap.companyId,
                firstName: snap.firstName,
                lastName: snap.lastName,
                email: snap.email.toLowerCase(),
                organisation: snap.organisation,
                direction: snap.direction,
                service: snap.service,
                functionLevel: snap.functionLevel,
                passwordHash: snap.passwordHash,
            })
            .where(eq(participantsTable.id, snap.id))
            .returning();
        return row ? hydrateParticipant(row) : null;
    }

    public async listWithCompany(params: ListParticipantsParams): Promise<Paginated<ParticipantAdminListItem>> {
        const perPage = Math.min(params.perPage, 200);
        const page = Math.max(params.page, 1);
        const companyFilter =
            params.companyId === undefined ? undefined : eq(participantsTable.companyId, params.companyId);

        const countBase = this.db.select({ total: sql<number>`cast(count(*) as int)` }).from(participantsTable);
        const [{ total }] = companyFilter ? await countBase.where(companyFilter) : await countBase;

        const joinBase = this.db
            .select({
                participant: participantsTable,
                companyId: companiesTable.id,
                companyName: companiesTable.name,
            })
            .from(participantsTable)
            .leftJoin(companiesTable, eq(participantsTable.companyId, companiesTable.id));

        const rows = companyFilter
            ? await joinBase
                  .where(companyFilter)
                  .orderBy(asc(participantsTable.lastName), asc(participantsTable.firstName))
                  .limit(perPage)
                  .offset((page - 1) * perPage)
            : await joinBase
                  .orderBy(asc(participantsTable.lastName), asc(participantsTable.firstName))
                  .limit(perPage)
                  .offset((page - 1) * perPage);

        const itemsBase: ParticipantAdminListItem[] = rows.map(row => ({
            id: row.participant.id,
            companyId: row.participant.companyId,
            firstName: row.participant.firstName,
            lastName: row.participant.lastName,
            email: row.participant.email,
            organisation: row.participant.organisation,
            direction: row.participant.direction,
            service: row.participant.service,
            functionLevel: row.participant.functionLevel,
            createdAt: row.participant.createdAt,
            company:
                row.companyId !== null && row.companyName !== null
                    ? { id: row.companyId, name: row.companyName }
                    : null,
            inviteStatus: {},
            responseCount: 0,
        }));

        const ids = itemsBase.map(p => p.id);
        if (ids.length === 0) {
            return {
                items: itemsBase,
                total,
                page,
                pages: Math.max(1, Math.ceil(total / perPage)),
                perPage,
            };
        }

        const tokenRows = await this.db
            .select()
            .from(inviteTokensTable)
            .where(inArray(inviteTokensTable.participantId, ids))
            .orderBy(desc(inviteTokensTable.createdAt));

        const countRows = await this.db
            .select({
                participantId: questionnaireResponsesTable.participantId,
                cnt: sql<number>`cast(count(*) as int)`,
            })
            .from(questionnaireResponsesTable)
            .where(
                and(
                    inArray(questionnaireResponsesTable.participantId, ids),
                    sql`${questionnaireResponsesTable.participantId} is not null`
                )
            )
            .groupBy(questionnaireResponsesTable.participantId);

        const responseCountByParticipant = new Map<number, number>();
        for (const row of countRows) {
            if (row.participantId !== null) {
                responseCountByParticipant.set(row.participantId, row.cnt);
            }
        }

        const tokenByParticipantQid = new Map<string, (typeof tokenRows)[0]>();
        for (const token of tokenRows) {
            const key = `${token.participantId}:${token.questionnaireId}`;
            const existing = tokenByParticipantQid.get(key);
            if (!existing || (token.createdAt && existing.createdAt && token.createdAt > existing.createdAt)) {
                tokenByParticipantQid.set(key, token);
            }
        }

        const selectedTokens = [...tokenByParticipantQid.values()];
        const campaignIdsForJoinCheck = [
            ...new Set(selectedTokens.map(t => t.campaignId).filter((c): c is number => c != null)),
        ];
        const joinedCampaignParticipantKeys = new Set<string>();
        if (campaignIdsForJoinCheck.length > 0 && ids.length > 0) {
            const joinedRows = await this.db
                .select({
                    campaignId: campaignParticipantsTable.campaignId,
                    participantId: campaignParticipantsTable.participantId,
                })
                .from(campaignParticipantsTable)
                .where(
                    and(
                        inArray(campaignParticipantsTable.participantId, ids),
                        inArray(campaignParticipantsTable.campaignId, campaignIdsForJoinCheck),
                        isNotNull(campaignParticipantsTable.joinedAt)
                    )
                );
            for (const row of joinedRows) {
                joinedCampaignParticipantKeys.add(`${row.campaignId}:${row.participantId}`);
            }
        }

        const inviteStatusByParticipant = new Map<number, Record<string, string>>();
        for (const [compound, token] of tokenByParticipantQid) {
            const [participantIdStr, qid] = compound.split(':');
            const participantId = Number(participantIdStr);
            const participationConfirmed =
                token.campaignId != null &&
                joinedCampaignParticipantKeys.has(`${token.campaignId}:${token.participantId}`);
            const status = invitationTokenAdminStatus({
                isActive: token.isActive,
                usedAt: token.usedAt,
                expiresAt: token.expiresAt,
                participationConfirmed,
            });
            const map = inviteStatusByParticipant.get(participantId) ?? {};
            map[qid] = status;
            inviteStatusByParticipant.set(participantId, map);
        }

        const items = itemsBase.map(p => ({
            ...p,
            inviteStatus: inviteStatusByParticipant.get(p.id) ?? {},
            responseCount: responseCountByParticipant.get(p.id) ?? 0,
        }));

        return {
            items,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / perPage)),
            perPage,
        };
    }

    public async listByCompanyId(companyId: number): Promise<Participant[]> {
        const rows = await this.db
            .select()
            .from(participantsTable)
            .where(eq(participantsTable.companyId, companyId))
            .orderBy(asc(participantsTable.lastName), asc(participantsTable.firstName));
        return rows.map(hydrateParticipant);
    }

    public async listCampaignParticipantProgress(campaignId: number): Promise<CampaignParticipantProgressItem[]> {
        const rows = await this.db
            .select({
                participantId: participantsTable.id,
                firstName: participantsTable.firstName,
                lastName: participantsTable.lastName,
                email: participantsTable.email,
                selfRatingStatus: participantProgressTable.selfRatingStatus,
                peerFeedbackStatus: participantProgressTable.peerFeedbackStatus,
                elementHumainStatus: participantProgressTable.elementHumainStatus,
                resultsStatus: participantProgressTable.resultsStatus,
            })
            .from(inviteTokensTable)
            .innerJoin(participantsTable, eq(inviteTokensTable.participantId, participantsTable.id))
            .leftJoin(
                participantProgressTable,
                and(
                    eq(participantProgressTable.campaignId, inviteTokensTable.campaignId),
                    eq(participantProgressTable.participantId, participantsTable.id)
                )
            )
            .where(eq(inviteTokensTable.campaignId, campaignId))
            .orderBy(asc(participantsTable.lastName), asc(participantsTable.firstName));

        const byId = new Map<number, CampaignParticipantProgressItem>();
        for (const row of rows) {
            if (!byId.has(row.participantId)) {
                byId.set(row.participantId, {
                    participantId: row.participantId,
                    fullName: `${row.firstName} ${row.lastName}`.trim(),
                    email: row.email,
                    selfRatingStatus: row.selfRatingStatus ?? 'pending',
                    peerFeedbackStatus: row.peerFeedbackStatus ?? 'pending',
                    elementHumainStatus: row.elementHumainStatus ?? 'locked',
                    resultsStatus: row.resultsStatus ?? 'locked',
                });
            }
        }
        return [...byId.values()];
    }

    public async listJoinedCampaignPeerChoices(
        campaignId: number,
        exceptParticipantId: number
    ): Promise<CampaignPeerChoiceItemDto[]> {
        const rows = await this.db
            .select({
                participantId: participantsTable.id,
                firstName: participantsTable.firstName,
                lastName: participantsTable.lastName,
            })
            .from(campaignParticipantsTable)
            .innerJoin(participantsTable, eq(campaignParticipantsTable.participantId, participantsTable.id))
            .where(
                and(
                    eq(campaignParticipantsTable.campaignId, campaignId),
                    isNotNull(campaignParticipantsTable.joinedAt),
                    ne(campaignParticipantsTable.participantId, exceptParticipantId)
                )
            )
            .orderBy(asc(participantsTable.lastName), asc(participantsTable.firstName));

        return rows.map(r => {
            const fullName = `${r.firstName} ${r.lastName}`.trim();
            return {
                participant_id: r.participantId,
                first_name: r.firstName,
                last_name: r.lastName,
                full_name: fullName.length > 0 ? fullName : `Participant #${String(r.participantId)}`,
            };
        });
    }

    public async eraseParticipantRgpd(
        id: number
    ): Promise<{ responsesRemoved: number; inviteTokensRemoved: number } | null> {
        return this.db.transaction(async tx => {
            const [existing] = await tx.select().from(participantsTable).where(eq(participantsTable.id, id)).limit(1);
            if (!existing) {
                return null;
            }

            const responses = await tx
                .select()
                .from(questionnaireResponsesTable)
                .where(eq(questionnaireResponsesTable.participantId, id));

            const tokens = await tx.select().from(inviteTokensTable).where(eq(inviteTokensTable.participantId, id));

            for (const response of responses) {
                await tx.delete(scoresTable).where(eq(scoresTable.responseId, response.id));
            }

            await tx.delete(questionnaireResponsesTable).where(eq(questionnaireResponsesTable.participantId, id));

            // Anonymise FK references on responses authored by or about this participant
            await tx
                .update(questionnaireResponsesTable)
                .set({ subjectParticipantId: null })
                .where(eq(questionnaireResponsesTable.subjectParticipantId, id));
            await tx
                .update(questionnaireResponsesTable)
                .set({ raterParticipantId: null })
                .where(eq(questionnaireResponsesTable.raterParticipantId, id));
            await tx
                .update(questionnaireResponsesTable)
                .set({ ratedParticipantId: null })
                .where(eq(questionnaireResponsesTable.ratedParticipantId, id));

            await tx.delete(inviteTokensTable).where(eq(inviteTokensTable.participantId, id));
            await tx.delete(participantsTable).where(eq(participantsTable.id, id));

            return {
                responsesRemoved: responses.length,
                inviteTokensRemoved: tokens.length,
            };
        });
    }
}
