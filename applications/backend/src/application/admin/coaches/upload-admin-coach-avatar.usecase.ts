// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import {
    ParticipantAvatarFileRequiredError,
    ParticipantAvatarFileTooLargeError,
    ParticipantAvatarFileTypeError,
} from '@src/domain/participant-session/participant-avatar.errors';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const adminCoachAvatarPublicPath = (coachId: number, cacheBuster?: number): string => {
    const base = `/api/admin/coaches/${coachId}/avatar`;
    return cacheBuster ? `${base}?v=${cacheBuster}` : base;
};

export class UploadAdminCoachAvatarUseCase {
    public constructor(private readonly coaches: ICoachesReadPort & ICoachesWritePort) {}

    public async execute(coachId: number, file: Express.Multer.File | undefined): Promise<{ avatar_url: string }> {
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

        const coach = await this.coaches.findById(coachId);
        if (!coach) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }

        await this.coaches.saveAvatar(coachId, file.buffer, mimeType);

        return { avatar_url: adminCoachAvatarPublicPath(coachId, Date.now()) };
    }
}
