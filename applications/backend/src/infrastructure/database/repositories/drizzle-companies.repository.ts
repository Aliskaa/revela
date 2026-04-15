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

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, companiesTable, participantsTable } from '@aor/drizzle';
import { asc, eq, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type {
    CompanyRecord,
    CompanyWithParticipantCount,
    CreateCompanyCommand,
    ICompaniesRepositoryPort,
    UpdateCompanyCommand,
} from '@src/interfaces/companies/ICompaniesRepository.port';

@Injectable()
export class DrizzleCompaniesRepository implements ICompaniesRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async findByName(name: string): Promise<CompanyRecord | null> {
        const [company] = await this.db.select().from(companiesTable).where(eq(companiesTable.name, name)).limit(1);
        return company ?? null;
    }

    public async findById(id: number): Promise<CompanyRecord | null> {
        const [company] = await this.db.select().from(companiesTable).where(eq(companiesTable.id, id)).limit(1);
        return company ?? null;
    }

    public async findByIdWithParticipantCount(id: number): Promise<CompanyWithParticipantCount | null> {
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
            ...row.company,
            participantCount: row.participantCount,
        };
    }

    public async create(command: CreateCompanyCommand): Promise<CompanyRecord> {
        const [company] = await this.db
            .insert(companiesTable)
            .values({
                name: command.name,
                contactName: command.contactName,
                contactEmail: command.contactEmail,
            })
            .returning();
        return company;
    }

    public async update(id: number, command: UpdateCompanyCommand): Promise<CompanyRecord | null> {
        const [company] = await this.db
            .update(companiesTable)
            .set({
                name: command.name,
                contactName: command.contactName,
                contactEmail: command.contactEmail,
            })
            .where(eq(companiesTable.id, id))
            .returning();
        return company ?? null;
    }

    public async deleteById(id: number): Promise<void> {
        await this.db.delete(companiesTable).where(eq(companiesTable.id, id));
    }

    public async listOrderedWithParticipantCount(): Promise<CompanyWithParticipantCount[]> {
        const rows = await this.db
            .select({
                company: companiesTable,
                participantCount: sql<number>`cast(count(${participantsTable.id}) as int)`,
            })
            .from(companiesTable)
            .leftJoin(participantsTable, eq(participantsTable.companyId, companiesTable.id))
            .groupBy(companiesTable.id)
            .orderBy(asc(companiesTable.name));

        return rows.map(row => ({
            ...row.company,
            participantCount: row.participantCount,
        }));
    }
}
