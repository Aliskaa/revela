// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    DRIZZLE_DB_SYMBOL,
    type DrizzleDb,
    and,
    asc,
    campaignParticipantsTable,
    campaignsTable,
    companiesTable,
    desc,
    eq,
    getTableColumns,
    ilike,
    inArray,
    inviteTokensTable,
    isNotNull,
    ne,
    or,
    participantProgressTable,
    participantsTable,
    questionnaireResponsesTable,
    scoresTable,
    sql,
} from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { invitationTokenAdminStatus } from '@aor/domain';
import { participantCampaignPeerAvatarPublicPath, adminParticipantAvatarPublicPath } from '@src/application/participant-session/upload-participant-avatar.usecase';
import { Participant, type ParticipantFunctionLevel } from '@src/domain/participants';
import type {
    CampaignParticipantInviteState,
    CampaignParticipantProgressItem,
    CampaignPeerChoiceItemDto,
    IParticipantsRepositoryPort,
    ListParticipantsParams,
    ParticipantAdminListItem,
    ParticipantCampaignAssignmentItem,
    ParticipantInviteAssignment,
    ParticipantProgressRecord,
    ParticipantTransparencyScoreSnapshot,
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
    avatarMimeType: string | null | undefined;
    passwordHash: string | null;
    createdAt: Date | null;
    createdByCoachId: number | null;
};

const { avatarData: _avatarDataColumn, ...participantColumnsWithoutAvatarData } = getTableColumns(participantsTable);

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
        avatarMimeType: row.avatarMimeType ?? null,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt,
        createdByCoachId: row.createdByCoachId,
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
            .select(participantColumnsWithoutAvatarData)
            .from(participantsTable)
            .where(eq(participantsTable.email, email.toLowerCase()))
            .limit(1);
        return row ? hydrateParticipant(row) : null;
    }

    public async findById(id: number): Promise<Participant | null> {
        const [row] = await this.db
            .select(participantColumnsWithoutAvatarData)
            .from(participantsTable)
            .where(eq(participantsTable.id, id))
            .limit(1);
        return row ? hydrateParticipant(row) : null;
    }

    public async findUpdatedAt(id: number): Promise<Date | null> {
        const [row] = await this.db
            .select({ updatedAt: participantsTable.updatedAt })
            .from(participantsTable)
            .where(eq(participantsTable.id, id))
            .limit(1);
        return row?.updatedAt ?? null;
    }

    public async findAvatar(participantId: number): Promise<{ data: Buffer; mimeType: string } | null> {
        const [row] = await this.db
            .select({
                avatarData: participantsTable.avatarData,
                avatarMimeType: participantsTable.avatarMimeType,
            })
            .from(participantsTable)
            .where(eq(participantsTable.id, participantId))
            .limit(1);
        if (!row?.avatarData || !row.avatarMimeType) {
            return null;
        }
        const data = Buffer.isBuffer(row.avatarData) ? row.avatarData : Buffer.from(row.avatarData);
        return { data, mimeType: row.avatarMimeType };
    }

    public async saveAvatar(participantId: number, data: Buffer, mimeType: string): Promise<void> {
        await this.db
            .update(participantsTable)
            .set({
                avatarData: data,
                avatarMimeType: mimeType,
                updatedAt: new Date(),
            })
            .where(eq(participantsTable.id, participantId));
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

    public async markPeerFeedbackCompletedForCampaignSubject(
        campaignId: number,
        participantId: number
    ): Promise<{ wasAlreadyCompleted: boolean; unlockedElementHumain: boolean }> {
        return this.db.transaction(async tx => {
            const [progress] = await tx
                .select({
                    selfRatingStatus: participantProgressTable.selfRatingStatus,
                    peerFeedbackStatus: participantProgressTable.peerFeedbackStatus,
                    elementHumainStatus: participantProgressTable.elementHumainStatus,
                })
                .from(participantProgressTable)
                .where(
                    and(
                        eq(participantProgressTable.campaignId, campaignId),
                        eq(participantProgressTable.participantId, participantId)
                    )
                )
                .limit(1);

            if (progress?.peerFeedbackStatus === 'completed') {
                return { wasAlreadyCompleted: true, unlockedElementHumain: false };
            }

            const [campaign] = await tx
                .select({ allowTestWithoutManualInputs: campaignsTable.allowTestWithoutManualInputs })
                .from(campaignsTable)
                .where(eq(campaignsTable.id, campaignId))
                .limit(1);
            const canSkipManualInputs = campaign?.allowTestWithoutManualInputs === true;
            const selfDone = progress?.selfRatingStatus === 'completed';
            const elementHumainCurrentlyLocked = (progress?.elementHumainStatus ?? 'locked') === 'locked';
            const shouldUnlockElementHumain = elementHumainCurrentlyLocked && (canSkipManualInputs || selfDone);

            const now = new Date();
            const patch = {
                peerFeedbackStatus: 'completed' as const,
                peerFeedbackCompletedAt: now,
                updatedAt: now,
                ...(shouldUnlockElementHumain ? { elementHumainStatus: 'pending' as const } : {}),
            };
            await tx
                .insert(participantProgressTable)
                .values({ campaignId, participantId, ...patch })
                .onConflictDoUpdate({
                    target: [participantProgressTable.campaignId, participantProgressTable.participantId],
                    set: patch,
                });
            return { wasAlreadyCompleted: false, unlockedElementHumain: shouldUnlockElementHumain };
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

    public async countPeerRatingsForCampaignSubject(campaignId: number, subjectParticipantId: number): Promise<number> {
        const [row] = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(questionnaireResponsesTable)
            .where(
                and(
                    eq(questionnaireResponsesTable.campaignId, campaignId),
                    eq(questionnaireResponsesTable.subjectParticipantId, subjectParticipantId),
                    eq(questionnaireResponsesTable.submissionKind, 'peer_rating')
                )
            );
        return row?.count ?? 0;
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
                createdByCoachId: snap.createdByCoachId,
            })
            .returning(participantColumnsWithoutAvatarData);
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
            .returning(participantColumnsWithoutAvatarData);
        return row ? hydrateParticipant(row) : null;
    }

    public async listWithCompany(params: ListParticipantsParams): Promise<Paginated<ParticipantAdminListItem>> {
        const perPage = Math.min(params.perPage, 200);
        const page = Math.max(params.page, 1);
        const filters = [];
        if (params.companyId !== undefined) {
            filters.push(eq(participantsTable.companyId, params.companyId));
        }
        if (params.coachId !== undefined) {
            if (params.companyId !== undefined) {
                // Vue scopée à une entreprise (ex. fiche entreprise, gestion participants d'une
                // campagne) : le coach voit tous les collaborateurs de l'entreprise dès lors qu'il
                // a au moins une campagne dans cette entreprise. Évite les imports en double et
                // aligne la liste sur le compteur global "Collaborateurs" de la fiche entreprise.
                const coachCompanyIds = this.db
                    .select({ id: campaignsTable.companyId })
                    .from(campaignsTable)
                    .where(eq(campaignsTable.coachId, params.coachId));
                filters.push(inArray(participantsTable.companyId, coachCompanyIds));
            } else {
                // Vue globale "mes participants" (dashboard coach) : restreint aux participants
                // ayant rejoint au moins une campagne attribuée à ce coach.
                const coachCampaignIds = this.db
                    .select({ id: campaignsTable.id })
                    .from(campaignsTable)
                    .where(eq(campaignsTable.coachId, params.coachId));
                const participantIdsInCoachCampaigns = this.db
                    .select({ id: campaignParticipantsTable.participantId })
                    .from(campaignParticipantsTable)
                    .where(inArray(campaignParticipantsTable.campaignId, coachCampaignIds));
                filters.push(inArray(participantsTable.id, participantIdsInCoachCampaigns));
            }
        }
        const searchTerm = params.search?.trim();
        if (searchTerm) {
            const pattern = `%${searchTerm}%`;
            const searchFilter = or(
                ilike(participantsTable.firstName, pattern),
                ilike(participantsTable.lastName, pattern),
                ilike(participantsTable.email, pattern)
            );
            if (searchFilter !== undefined) {
                filters.push(searchFilter);
            }
        }
        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        const countBase = this.db.select({ total: sql<number>`cast(count(*) as int)` }).from(participantsTable);
        const [{ total }] = whereClause ? await countBase.where(whereClause) : await countBase;

        const joinBase = this.db
            .select({
                participant: participantColumnsWithoutAvatarData,
                companyId: companiesTable.id,
                companyName: companiesTable.name,
            })
            .from(participantsTable)
            .leftJoin(companiesTable, eq(participantsTable.companyId, companiesTable.id));

        const rows = whereClause
            ? await joinBase
                  .where(whereClause)
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
            createdByCoachId: row.participant.createdByCoachId,
            company:
                row.companyId !== null && row.companyName !== null
                    ? { id: row.companyId, name: row.companyName }
                    : null,
            avatar_url: row.participant.avatarMimeType
                ? adminParticipantAvatarPublicPath(
                      row.participant.id,
                      row.participant.updatedAt?.getTime()
                  )
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

    public async findByIdEnriched(id: number, params: { coachId?: number }): Promise<ParticipantAdminListItem | null> {
        const [row] = await this.db
            .select({
                participant: participantColumnsWithoutAvatarData,
                companyId: companiesTable.id,
                companyName: companiesTable.name,
            })
            .from(participantsTable)
            .leftJoin(companiesTable, eq(participantsTable.companyId, companiesTable.id))
            .where(eq(participantsTable.id, id))
            .limit(1);
        if (!row) {
            return null;
        }

        if (params.coachId !== undefined) {
            // Le coach a accès à un participant dès lors qu'il a au moins une campagne dans
            // l'entreprise du participant — pas seulement si le participant figure dans une
            // de ses campagnes. Aligne la fiche détail sur la liste de la fiche entreprise.
            // Cf. ADR-008 §scope=coach.
            if (row.participant.companyId === null) {
                return null;
            }
            const [accessRow] = await this.db
                .select({ id: campaignsTable.id })
                .from(campaignsTable)
                .where(
                    and(
                        eq(campaignsTable.coachId, params.coachId),
                        eq(campaignsTable.companyId, row.participant.companyId)
                    )
                )
                .limit(1);
            if (!accessRow) {
                return null;
            }
        }

        const itemBase: ParticipantAdminListItem = {
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
            createdByCoachId: row.participant.createdByCoachId,
            company:
                row.companyId !== null && row.companyName !== null
                    ? { id: row.companyId, name: row.companyName }
                    : null,
            avatar_url: row.participant.avatarMimeType
                ? adminParticipantAvatarPublicPath(
                      row.participant.id,
                      row.participant.updatedAt?.getTime()
                  )
                : null,
            inviteStatus: {},
            responseCount: 0,
        };

        const tokenRows = await this.db
            .select()
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, id))
            .orderBy(desc(inviteTokensTable.createdAt));

        const [{ cnt: responseCount }] = await this.db
            .select({ cnt: sql<number>`cast(count(*) as int)` })
            .from(questionnaireResponsesTable)
            .where(eq(questionnaireResponsesTable.participantId, id));

        const tokenByQid = new Map<string, (typeof tokenRows)[0]>();
        for (const token of tokenRows) {
            const existing = tokenByQid.get(token.questionnaireId);
            if (!existing || (token.createdAt && existing.createdAt && token.createdAt > existing.createdAt)) {
                tokenByQid.set(token.questionnaireId, token);
            }
        }

        const campaignIdsForJoinCheck = [
            ...new Set([...tokenByQid.values()].map(t => t.campaignId).filter((c): c is number => c != null)),
        ];
        const joinedCampaigns = new Set<number>();
        if (campaignIdsForJoinCheck.length > 0) {
            const joinedRows = await this.db
                .select({ campaignId: campaignParticipantsTable.campaignId })
                .from(campaignParticipantsTable)
                .where(
                    and(
                        eq(campaignParticipantsTable.participantId, id),
                        inArray(campaignParticipantsTable.campaignId, campaignIdsForJoinCheck),
                        isNotNull(campaignParticipantsTable.joinedAt)
                    )
                );
            for (const r of joinedRows) {
                joinedCampaigns.add(r.campaignId);
            }
        }

        const inviteStatus: Record<string, string> = {};
        for (const [qid, token] of tokenByQid) {
            const participationConfirmed = token.campaignId != null && joinedCampaigns.has(token.campaignId);
            inviteStatus[qid] = invitationTokenAdminStatus({
                isActive: token.isActive,
                usedAt: token.usedAt,
                expiresAt: token.expiresAt,
                participationConfirmed,
            });
        }

        return {
            ...itemBase,
            inviteStatus,
            responseCount,
        };
    }

    public async listCampaignsForParticipant(
        participantId: number,
        params: { coachId?: number }
    ): Promise<ParticipantCampaignAssignmentItem[]> {
        const filters = [eq(campaignParticipantsTable.participantId, participantId)];
        if (params.coachId !== undefined) {
            filters.push(eq(campaignsTable.coachId, params.coachId));
        }
        const rows = await this.db
            .select({
                campaignId: campaignsTable.id,
                campaignName: campaignsTable.name,
                status: campaignsTable.status,
                companyId: companiesTable.id,
                companyName: companiesTable.name,
                invitedAt: campaignParticipantsTable.invitedAt,
                joinedAt: campaignParticipantsTable.joinedAt,
            })
            .from(campaignParticipantsTable)
            .innerJoin(campaignsTable, eq(campaignParticipantsTable.campaignId, campaignsTable.id))
            .leftJoin(companiesTable, eq(campaignsTable.companyId, companiesTable.id))
            .where(and(...filters))
            .orderBy(desc(campaignParticipantsTable.invitedAt));
        return rows.map(r => ({
            campaignId: r.campaignId,
            campaignName: r.campaignName,
            status: r.status,
            companyId: r.companyId,
            companyName: r.companyName,
            invitedAt: r.invitedAt,
            joinedAt: r.joinedAt,
        }));
    }

    public async listByCompanyId(companyId: number): Promise<Participant[]> {
        const rows = await this.db
            .select(participantColumnsWithoutAvatarData)
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
                avatarMimeType: participantsTable.avatarMimeType,
                updatedAt: participantsTable.updatedAt,
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
                    avatar_url: row.avatarMimeType
                        ? adminParticipantAvatarPublicPath(row.participantId, row.updatedAt?.getTime())
                        : null,
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
                avatarMimeType: participantsTable.avatarMimeType,
                updatedAt: participantsTable.updatedAt,
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
                avatar_url: r.avatarMimeType
                    ? participantCampaignPeerAvatarPublicPath(
                          campaignId,
                          r.participantId,
                          r.updatedAt?.getTime()
                      )
                    : null,
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

    public async findTransparencyScoreSnapshot(
        campaignId: number,
        participantId: number
    ): Promise<ParticipantTransparencyScoreSnapshot | null> {
        const [row] = await this.db
            .select({
                campaignId: participantProgressTable.campaignId,
                participantId: participantProgressTable.participantId,
                value: participantProgressTable.transparencyScoreValue,
                peerCount: participantProgressTable.transparencyScorePeerCount,
                activatedAt: participantProgressTable.transparencyScoreActivatedAt,
                activatedByCoachId: participantProgressTable.transparencyScoreActivatedByCoachId,
            })
            .from(participantProgressTable)
            .where(
                and(
                    eq(participantProgressTable.campaignId, campaignId),
                    eq(participantProgressTable.participantId, participantId)
                )
            )
            .limit(1);
        if (!row || row.activatedAt === null || row.value === null || row.peerCount === null) {
            return null;
        }
        return {
            campaignId: row.campaignId,
            participantId: row.participantId,
            value: row.value,
            peerCount: row.peerCount,
            activatedAt: row.activatedAt,
            activatedByCoachId: row.activatedByCoachId,
        };
    }

    public async saveTransparencyScoreSnapshot(input: {
        campaignId: number;
        participantId: number;
        value: number;
        peerCount: number;
        activatedByCoachId: number | null;
    }): Promise<ParticipantTransparencyScoreSnapshot> {
        const now = new Date();
        await this.db
            .insert(participantProgressTable)
            .values({
                campaignId: input.campaignId,
                participantId: input.participantId,
                transparencyScoreValue: input.value,
                transparencyScorePeerCount: input.peerCount,
                transparencyScoreActivatedAt: now,
                transparencyScoreActivatedByCoachId: input.activatedByCoachId,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: [participantProgressTable.campaignId, participantProgressTable.participantId],
                set: {
                    transparencyScoreValue: input.value,
                    transparencyScorePeerCount: input.peerCount,
                    transparencyScoreActivatedAt: now,
                    transparencyScoreActivatedByCoachId: input.activatedByCoachId,
                    updatedAt: now,
                },
            });
        return {
            campaignId: input.campaignId,
            participantId: input.participantId,
            value: input.value,
            peerCount: input.peerCount,
            activatedAt: now,
            activatedByCoachId: input.activatedByCoachId,
        };
    }
}
