// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class GetAdminCompanyUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort }) {}

    public async execute(companyId: number) {
        const row = await this.ports.companies.findByIdWithParticipantCount(companyId);
        if (!row) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        return row;
    }
}
