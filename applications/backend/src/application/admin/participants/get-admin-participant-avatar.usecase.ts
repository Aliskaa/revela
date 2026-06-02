// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantAvatarNotFoundError } from '@src/domain/participant-session/participant-avatar.errors';
import type {
    IParticipantsAdminReadPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class GetAdminParticipantAvatarUseCase {
    public constructor(private readonly participants: IParticipantsIdentityReaderPort & IParticipantsAdminReadPort) {}

    public async execute(
        participantId: number,
        params: { coachId?: number }
    ): Promise<{ buffer: Buffer; mimeType: string }> {
        const detail = await this.participants.findByIdEnriched(participantId, params);
        if (!detail) {
            throw new ParticipantAvatarNotFoundError();
        }

        const stored = await this.participants.findAvatar(participantId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
