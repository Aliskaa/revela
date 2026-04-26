// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class ListAdminCompaniesUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort }) {}

    public async execute() {
        return this.ports.companies.listOrderedWithParticipantCount();
    }
}
