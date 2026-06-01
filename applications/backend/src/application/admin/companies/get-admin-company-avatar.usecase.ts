// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import { ParticipantAvatarNotFoundError } from '@src/domain/participant-session/participant-avatar.errors';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class GetAdminCompanyAvatarUseCase {
    public constructor(private readonly companies: ICompaniesReadPort) {}

    public async execute(companyId: number): Promise<{ buffer: Buffer; mimeType: string }> {
        const company = await this.companies.findByIdWithParticipantCount(companyId);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        const stored = await this.companies.findAvatar(companyId);
        if (!stored) {
            throw new ParticipantAvatarNotFoundError();
        }
        return { buffer: stored.data, mimeType: stored.mimeType };
    }
}
