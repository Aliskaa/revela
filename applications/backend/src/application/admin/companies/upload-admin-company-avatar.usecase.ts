// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import {
    ParticipantAvatarFileRequiredError,
    ParticipantAvatarFileTooLargeError,
    ParticipantAvatarFileTypeError,
} from '@src/domain/participant-session/participant-avatar.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const adminCompanyAvatarPublicPath = (companyId: number, cacheBuster?: number): string => {
    const base = `/api/admin/companies/${companyId}/avatar`;
    return cacheBuster ? `${base}?v=${cacheBuster}` : base;
};

export class UploadAdminCompanyAvatarUseCase {
    public constructor(private readonly companies: ICompaniesReadPort & ICompaniesWritePort) {}

    public async execute(companyId: number, file: Express.Multer.File | undefined): Promise<{ avatar_url: string }> {
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

        const company = await this.companies.findByIdWithParticipantCount(companyId);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        await this.companies.saveAvatar(companyId, file.buffer, mimeType);

        return { avatar_url: adminCompanyAvatarPublicPath(companyId, Date.now()) };
    }
}
