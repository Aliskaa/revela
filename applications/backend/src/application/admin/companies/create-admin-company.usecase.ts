/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { AdminValidationError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';

const normalizeOptional = (value: string | undefined | null): string | undefined => {
    if (value === undefined || value === null) {
        return undefined;
    }
    const t = value.trim();
    return t.length === 0 ? undefined : t;
};

export class CreateAdminCompanyUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort & ICompaniesWritePort }) {}

    public async execute(body: { name?: string; contact_name?: string | null; contact_email?: string | null }) {
        const name = (body.name ?? '').trim();
        if (name.length === 0) {
            throw new AdminValidationError("Le nom de l'entreprise est requis.");
        }
        const existing = await this.ports.companies.findByName(name);
        if (existing) {
            throw new AdminValidationError('Une entreprise avec ce nom existe déjà.');
        }
        const contactName = normalizeOptional(body.contact_name ?? undefined) ?? undefined;
        const contactEmail = normalizeOptional(body.contact_email ?? undefined) ?? undefined;
        const created = await this.ports.companies.create({ name, contactName, contactEmail });
        return { ...created, participantCount: 0 };
    }
}
