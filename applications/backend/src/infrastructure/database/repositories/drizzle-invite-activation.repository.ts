// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, inviteTokensTable, participantsTable } from '@aor/drizzle';
import { eq } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    IInviteActivationWritePort,
    InviteActivationWriteParams,
} from '@src/interfaces/invitations/IInviteActivationWrite.port';

@Injectable()
export class DrizzleInviteActivationRepository implements IInviteActivationWritePort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async setParticipantPasswordAndConsumeInvite(params: InviteActivationWriteParams): Promise<void> {
        await this.db.transaction(async tx => {
            await tx
                .update(participantsTable)
                .set({ passwordHash: params.passwordHash })
                .where(eq(participantsTable.id, params.participantId));
            await tx
                .update(inviteTokensTable)
                .set({ usedAt: new Date() })
                .where(eq(inviteTokensTable.id, params.invitationId));
        });
    }
}
