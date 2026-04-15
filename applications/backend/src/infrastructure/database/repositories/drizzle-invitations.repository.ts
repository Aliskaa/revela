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

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, inviteTokensTable } from '@aor/drizzle';
import { desc, eq } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    CreateInvitationCommand,
    IInvitationsRepositoryPort,
    InvitationRecord,
} from '@src/interfaces/invitations/IInvitationsRepository.port';

@Injectable()
export class DrizzleInvitationsRepository implements IInvitationsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByToken(token: string): Promise<InvitationRecord | null> {
        const [invitation] = await this.db
            .select()
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.token, token))
            .limit(1);
        return invitation ?? null;
    }

    public async create(command: CreateInvitationCommand): Promise<InvitationRecord> {
        const [invitation] = await this.db
            .insert(inviteTokensTable)
            .values({
                token: command.token,
                participantId: command.participantId,
                campaignId: command.campaignId ?? null,
                questionnaireId: command.questionnaireId,
                expiresAt: command.expiresAt,
            })
            .returning();
        return invitation;
    }

    public async markUsed(id: number): Promise<void> {
        await this.db.update(inviteTokensTable).set({ usedAt: new Date() }).where(eq(inviteTokensTable.id, id));
    }

    public async findByParticipantId(participantId: number): Promise<InvitationRecord[]> {
        return this.db
            .select()
            .from(inviteTokensTable)
            .where(eq(inviteTokensTable.participantId, participantId))
            .orderBy(desc(inviteTokensTable.createdAt));
    }
}
