// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class DeleteAdminCompanyUseCase {
    public constructor(
        private readonly ports: {
            readonly companies: ICompaniesReadPort & ICompaniesWritePort;
        }
    ) {}

    public async execute(companyId: number): Promise<void> {
        const row = await this.ports.companies.findByIdWithParticipantCount(companyId);
        if (!row) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        if (row.participantCount > 0) {
            throw new AdminValidationError(
                'Impossible de supprimer : des participants sont encore rattachés à cette entreprise.'
            );
        }
        await this.ports.companies.deleteById(companyId);
    }
}
