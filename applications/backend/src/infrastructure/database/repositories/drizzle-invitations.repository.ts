// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, and, desc, eq, gt, inviteTokensTable, isNull, lt, or } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { Invitation } from '@src/domain/invitations';
import type { IInvitationsRepositoryPort } from '@src/interfaces/invitations/IInvitationsRepository.port';

type InvitationRow = {
    id: number;
    token: string;
    participantId: number;
    campaignId: number | null;
    questionnaireId: string;
    createdAt: Date | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    isActive: boolean;
};

const hydrateInvitation = (row: InvitationRow): Invitation =>
    Invitation.hydrate({
        id: row.id,
        token: row.token,
        participantId: row.participantId,
        campaignId: row.campaignId,
        questionnaireId: row.questionnaireId,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
        isActive: row.isActive,
    });

@Injectable()
export class DrizzleInvitationsRepository implements IInvitationsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByToken(token: string): Promise<Invitation | null> {
        const [row] = await this.db.select().from(inviteTokensTable).where(eq(inviteTokensTable.token, token)).limit(1);
        return row ? hydrateInvitation(row) : null;
    }

    public async findByParticipantId(participantId: number): Promise<Invitation[]> {
        const rows = await this.db
            .select()
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, participantId))
            .orderBy(desc(inviteTokensTable.createdAt));
        return rows.map(hydrateInvitation);
    }

    public async create(draft: Invitation): Promise<Invitation> {
        return this.db.transaction(async tx => {
            const campaignId = draft.campaignId;
            const qid = draft.questionnaireId;
            const assignmentMatch = and(
                eq(inviteTokensTable.participantId, draft.participantId),
                campaignId === null
                    ? isNull(inviteTokensTable.campaignId)
                    : eq(inviteTokensTable.campaignId, campaignId),
                eq(inviteTokensTable.questionnaireId, qid)
            );
            const now = new Date();

            await tx
                .update(inviteTokensTable)
                .set({ isActive: false })
                .where(
                    and(
                        assignmentMatch,
                        eq(inviteTokensTable.isActive, true),
                        isNull(inviteTokensTable.usedAt),
                        lt(inviteTokensTable.expiresAt, now)
                    )
                );

            const [existing] = await tx
                .select()
                .from(inviteTokensTable)
                .where(
                    and(
                        assignmentMatch,
                        eq(inviteTokensTable.isActive, true),
                        isNull(inviteTokensTable.usedAt),
                        or(isNull(inviteTokensTable.expiresAt), gt(inviteTokensTable.expiresAt, now))
                    )
                )
                .orderBy(desc(inviteTokensTable.createdAt), desc(inviteTokensTable.id))
                .limit(1);
            if (existing) {
                return hydrateInvitation(existing);
            }

            const [inserted] = await tx
                .insert(inviteTokensTable)
                .values({
                    token: draft.token,
                    participantId: draft.participantId,
                    campaignId,
                    questionnaireId: qid,
                    expiresAt: draft.expiresAt ?? undefined,
                })
                .returning();
            return hydrateInvitation(inserted);
        });
    }
}
