// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type {
    CompanyWithParticipantCountReadModel,
    ICompaniesReadPort,
    ICompaniesWritePort,
} from '@src/interfaces/companies/ICompaniesRepository.port';

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
    ): Promise<CompanyWithParticipantCountReadModel> {
        const current = await this.ports.companies.findById(companyId);
        if (!current) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        const nextName = body.name !== undefined ? body.name.trim() : current.name;
        if (nextName.length === 0) {
            throw new AdminValidationError("Le nom de l'entreprise est requis.");
        }
        if (nextName !== current.name) {
            const taken = await this.ports.companies.findByName(nextName);
            if (taken && taken.id !== companyId) {
                throw new AdminValidationError('Une entreprise avec ce nom existe déjà.');
            }
        }

        const nextContactName =
            body.contact_name !== undefined ? normalizeNullable(body.contact_name) : current.contactName;
        const nextContactEmail =
            body.contact_email !== undefined ? normalizeNullable(body.contact_email) : current.contactEmail;

        const updated = current.rename(nextName).updateContact(nextContactName, nextContactEmail);
        const saved = await this.ports.companies.save(updated);
        if (!saved) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        const withCount = await this.ports.companies.findByIdWithParticipantCount(companyId);
        if (!withCount) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }
        return withCount;
    }
}
