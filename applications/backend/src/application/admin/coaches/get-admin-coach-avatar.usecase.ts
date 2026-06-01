// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import { ParticipantAvatarNotFoundError } from '@src/domain/participant-session/participant-avatar.errors';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class GetAdminCoachAvatarUseCase {
    public constructor(private readonly coaches: ICoachesReadPort) {}

    public async execute(coachId: number): Promise<{ buffer: Buffer; mimeType: string }> {
        const coach = await this.coaches.findById(coachId);
        if (!coach) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }

        const stored = await this.coaches.findAvatar(coachId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
