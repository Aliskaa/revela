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

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';

const normalizeNullable = (value: string | undefined | null): string | null => {
    if (value === undefined || value === null) {
        return null;
    }
    const t = value.trim();
    return t.length === 0 ? null : t;
};

export class UpdateAdminCompanyUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort & ICompaniesWritePort }) {}

    public async execute(
        companyId: number,
        body: { name?: string; contact_name?: string | null; contact_email?: string | null }
    ) {
        const current = await this.ports.companies.findById(companyId);
        if (!current) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        const name = body.name !== undefined ? body.name.trim() : current.name;
        if (name.length === 0) {
            throw new AdminValidationError("Le nom de l'entreprise est requis.");
        }
        if (name !== current.name) {
            const taken = await this.ports.companies.findByName(name);
            if (taken && taken.id !== companyId) {
                throw new AdminValidationError('Une entreprise avec ce nom existe déjà.');
            }
        }
        const contactName =
            body.contact_name !== undefined ? normalizeNullable(body.contact_name) : current.contactName;
        const contactEmail =
            body.contact_email !== undefined ? normalizeNullable(body.contact_email) : current.contactEmail;
        const updated = await this.ports.companies.update(companyId, { name, contactName, contactEmail });
        if (!updated) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        const withCount = await this.ports.companies.findByIdWithParticipantCount(companyId);
        if (!withCount) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        return withCount;
    }
}
