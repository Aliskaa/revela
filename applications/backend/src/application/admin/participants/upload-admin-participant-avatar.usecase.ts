// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import {
    ParticipantAvatarFileRequiredError,
    ParticipantAvatarFileTooLargeError,
    ParticipantAvatarFileTypeError,
} from '@src/domain/participant-session/participant-avatar.errors';
import { adminParticipantAvatarPublicPath } from '@src/application/participant-session/upload-participant-avatar.usecase';
import type {
    IParticipantsAdminReadPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UploadAdminParticipantAvatarUseCase {
    public constructor(private readonly participants: IParticipantsAdminReadPort & IParticipantsWriterPort) {}

    public async execute(
        participantId: number,
        file: Express.Multer.File | undefined,
        params: { coachId?: number }
    ): Promise<{ avatar_url: string }> {
        if (!file?.buffer || file.buffer.length === 0) {
            throw new ParticipantAvatarFileRequiredError();
        }
        if (file.size > MAX_AVATAR_BYTES) {
            throw new ParticipantAvatarFileTooLargeError();
        }
        const mimeType = file.mimetype?.toLowerCase() ?? '';
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            throw new ParticipantAvatarFileTypeError();
        }

        const detail = await this.participants.findByIdEnriched(participantId, params);
        if (!detail) {
            throw new AdminResourceNotFoundError('Collaborateur introuvable.');
        }

        await this.participants.saveAvatar(participantId, file.buffer, mimeType);

        return { avatar_url: adminParticipantAvatarPublicPath(participantId, Date.now()) };
    }
}
