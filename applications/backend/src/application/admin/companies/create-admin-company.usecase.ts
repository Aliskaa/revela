// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminValidationError } from '@src/domain/admin/admin.errors';
import { Company } from '@src/domain/companies';
import type {
    CompanyWithParticipantCountReadModel,
    ICompaniesReadPort,
    ICompaniesWritePort,
} from '@src/interfaces/companies/ICompaniesRepository.port';

const normalizeOptional = (value: string | undefined | null): string | null => {
    if (value === undefined || value === null) {
        return null;
    }
    const t = value.trim();
    return t.length === 0 ? null : t;
};

export class CreateAdminCompanyUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort & ICompaniesWritePort }) {}

    public async execute(body: {
        name?: string;
        contact_name?: string | null;
        contact_email?: string | null;
    }): Promise<CompanyWithParticipantCountReadModel> {
        const name = (body.name ?? '').trim();
        if (name.length === 0) {
            throw new AdminValidationError("Le nom de l'entreprise est requis.");
        }
        const existing = await this.ports.companies.findByName(name);
        if (existing) {
            throw new AdminValidationError('Une entreprise avec ce nom existe déjà.');
        }
        const draft = Company.create({
            name,
            contactName: normalizeOptional(body.contact_name),
            contactEmail: normalizeOptional(body.contact_email),
        });
        const created = await this.ports.companies.create(draft);
        return {
            id: created.id,
            name: created.name,
            contactName: created.contactName,
            contactEmail: created.contactEmail,
            createdAt: created.createdAt,
            participantCount: 0,
        };
    }
}
