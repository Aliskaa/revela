// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantAccountNotFoundError } from '@src/domain/participant-session/participant-session.errors';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

import {
    ParticipantAvatarFileRequiredError,
    ParticipantAvatarFileTooLargeError,
    ParticipantAvatarFileTypeError,
    ParticipantAvatarNotFoundError,
} from '@src/domain/participant-session/participant-avatar.errors';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const participantAvatarPublicPath = (cacheBuster?: number): string =>
    cacheBuster ? `/api/participant/avatars/me?v=${cacheBuster}` : '/api/participant/avatars/me';

export const adminParticipantAvatarPublicPath = (participantId: number, cacheBuster?: number): string => {
    const base = `/api/admin/participants/${participantId}/avatar`;
    return cacheBuster ? `${base}?v=${cacheBuster}` : base;
};

export const participantCampaignPeerAvatarPublicPath = (
    campaignId: number,
    peerParticipantId: number,
    cacheBuster?: number
): string => {
    const base = `/api/participant/campaigns/${campaignId}/peers/${peerParticipantId}/avatar`;
    return cacheBuster ? `${base}?v=${cacheBuster}` : base;
};

export const participantCampaignCoachAvatarPublicPath = (campaignId: number, cacheBuster?: number): string => {
    const base = `/api/participant/campaigns/${campaignId}/coach/avatar`;
    return cacheBuster ? `${base}?v=${cacheBuster}` : base;
};

export class UploadParticipantAvatarUseCase {
    public constructor(
        private readonly participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort
    ) {}

    public async execute(participantId: number, file: Express.Multer.File | undefined): Promise<{ avatar_url: string }> {
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

        const current = await this.participants.findById(participantId);
        if (!current) {
            throw new ParticipantAccountNotFoundError();
        }

        await this.participants.saveAvatar(participantId, file.buffer, mimeType);

        return { avatar_url: participantAvatarPublicPath(Date.now()) };
    }
}

export class GetParticipantAvatarUseCase {
    public constructor(private readonly participants: IParticipantsIdentityReaderPort) {}

    public async execute(participantId: number): Promise<{ buffer: Buffer; mimeType: string }> {
        const stored = await this.participants.findAvatar(participantId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
