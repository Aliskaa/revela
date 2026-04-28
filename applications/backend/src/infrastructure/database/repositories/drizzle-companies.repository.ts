// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    DRIZZLE_DB_SYMBOL,
    type DrizzleDb,
    asc,
    campaignsTable,
    companiesTable,
    eq,
    inArray,
    participantsTable,
    sql,
} from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { Company } from '@src/domain/companies';
import type {
    CompanyWithParticipantCountReadModel,
    ICompaniesRepositoryPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';

type CompanyRow = {
    id: number;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    createdAt: Date | null;
};

const hydrateCompany = (row: CompanyRow): Company =>
    Company.hydrate({
        id: row.id,
        name: row.name,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        createdAt: row.createdAt,
    });

@Injectable()
export class DrizzleCompaniesRepository implements ICompaniesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByName(name: string): Promise<Company | null> {
        const [row] = await this.db.select().from(companiesTable).where(eq(companiesTable.name, name)).limit(1);
        return row ? hydrateCompany(row) : null;
    }

    public async findById(id: number): Promise<Company | null> {
        const [row] = await this.db.select().from(companiesTable).where(eq(companiesTable.id, id)).limit(1);
        return row ? hydrateCompany(row) : null;
    }

    public async findByIdWithParticipantCount(id: number): Promise<CompanyWithParticipantCountReadModel | null> {
        const rows = await this.db
            .select({
                company: companiesTable,
                participantCount: sql<number>`cast(count(${participantsTable.id}) as int)`,
            })
            .from(companiesTable)
            .leftJoin(participantsTable, eq(participantsTable.companyId, companiesTable.id))
            .where(eq(companiesTable.id, id))
            .groupBy(companiesTable.id)
            .limit(1);
        const [row] = rows;
        if (!row) {
            return null;
        }
        return {
            id: row.company.id,
            name: row.company.name,
            contactName: row.company.contactName,
            contactEmail: row.company.contactEmail,
            createdAt: row.company.createdAt,
            participantCount: row.participantCount,
        };
    }

    public async listOrderedWithParticipantCount(params?: {
        coachId?: number;
    }): Promise<CompanyWithParticipantCountReadModel[]> {
        const baseQuery = this.db
            .select({
                company: companiesTable,
                participantCount: sql<number>`cast(count(${participantsTable.id}) as int)`,
            })
            .from(companiesTable)
            .leftJoin(participantsTable, eq(participantsTable.companyId, companiesTable.id));

        // Restreint aux entreprises ayant au moins une campagne attribuée à ce coach (scope=coach).
        const rows =
            params?.coachId !== undefined
                ? await baseQuery
                      .where(
                          inArray(
                              companiesTable.id,
                              this.db
                                  .select({ id: campaignsTable.companyId })
                                  .from(campaignsTable)
                                  .where(eq(campaignsTable.coachId, params.coachId))
                          )
                      )
                      .groupBy(companiesTable.id)
                      .orderBy(asc(companiesTable.name))
                : await baseQuery.groupBy(companiesTable.id).orderBy(asc(companiesTable.name));

        return rows.map(row => ({
            id: row.company.id,
            name: row.company.name,
            contactName: row.company.contactName,
            contactEmail: row.company.contactEmail,
            createdAt: row.company.createdAt,
            participantCount: row.participantCount,
        }));
    }

    public async create(company: Company): Promise<Company> {
        const [row] = await this.db
            .insert(companiesTable)
            .values({
                name: company.name,
                contactName: company.contactName,
                contactEmail: company.contactEmail,
            })
            .returning();
        return hydrateCompany(row);
    }

    public async save(company: Company): Promise<Company | null> {
        if (!company.isPersisted()) {
            throw new Error('Cannot save() a non-persisted Company. Use create() instead.');
        }
        const [row] = await this.db
            .update(companiesTable)
            .set({
                name: company.name,
                contactName: company.contactName,
                contactEmail: company.contactEmail,
            })
            .where(eq(companiesTable.id, company.id))
            .returning();
        return row ? hydrateCompany(row) : null;
    }

    public async deleteById(id: number): Promise<void> {
        await this.db.delete(companiesTable).where(eq(companiesTable.id, id));
    }
}
