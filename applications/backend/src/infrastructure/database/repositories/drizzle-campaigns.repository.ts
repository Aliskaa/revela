// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, and, asc, campaignsTable, eq, sql } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import { Campaign, type CampaignStatus } from '@src/domain/campaigns';
import type { ICampaignsRepositoryPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

type CampaignRow = {
    id: number;
    coachId: number;
    companyId: number;
    name: string;
    questionnaireId: string | null;
    status: CampaignStatus;
    allowTestWithoutManualInputs: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date | null;
};

const SELECT_COLUMNS = {
    id: campaignsTable.id,
    coachId: campaignsTable.coachId,
    companyId: campaignsTable.companyId,
    name: campaignsTable.name,
    questionnaireId: campaignsTable.questionnaireId,
    status: campaignsTable.status,
    allowTestWithoutManualInputs: campaignsTable.allowTestWithoutManualInputs,
    startsAt: campaignsTable.startsAt,
    endsAt: campaignsTable.endsAt,
    createdAt: campaignsTable.createdAt,
} as const;

const hydrateCampaign = (row: CampaignRow): Campaign =>
    Campaign.hydrate({
        id: row.id,
        coachId: row.coachId,
        companyId: row.companyId,
        name: row.name,
        questionnaireId: row.questionnaireId,
        status: row.status,
        allowTestWithoutManualInputs: row.allowTestWithoutManualInputs,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        createdAt: row.createdAt,
    });

@Injectable()
export class DrizzleCampaignsRepository implements ICampaignsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listAll(params?: { coachId?: number }): Promise<Campaign[]> {
        const query = this.db.select(SELECT_COLUMNS).from(campaignsTable).orderBy(asc(campaignsTable.id));
        const rows = params?.coachId ? await query.where(eq(campaignsTable.coachId, params.coachId)) : await query;
        return rows.map(hydrateCampaign);
    }

    public async findById(id: number, params?: { coachId?: number }): Promise<Campaign | null> {
        const query = this.db.select(SELECT_COLUMNS).from(campaignsTable).limit(1);
        const [row] =
            params?.coachId !== undefined
                ? await query.where(and(eq(campaignsTable.id, id), eq(campaignsTable.coachId, params.coachId)))
                : await query.where(eq(campaignsTable.id, id));
        return row ? hydrateCampaign(row) : null;
    }

    public async findByCompanyAndName(companyId: number, name: string): Promise<Campaign | null> {
        const [row] = await this.db
            .select(SELECT_COLUMNS)
            .from(campaignsTable)
            .where(and(eq(campaignsTable.companyId, companyId), eq(campaignsTable.name, name)))
            .limit(1);
        return row ? hydrateCampaign(row) : null;
    }

    public async create(campaign: Campaign): Promise<Campaign> {
        const snap = campaign.persistenceSnapshot();
        if (snap.questionnaireId === null) {
            throw new Error('Cannot create a Campaign without questionnaireId.');
        }
        const [row] = await this.db
            .insert(campaignsTable)
            .values({
                coachId: snap.coachId,
                companyId: snap.companyId,
                name: snap.name,
                questionnaireId: snap.questionnaireId,
                status: snap.status,
                allowTestWithoutManualInputs: snap.allowTestWithoutManualInputs,
                startsAt: snap.startsAt,
                endsAt: snap.endsAt,
            })
            .returning(SELECT_COLUMNS);
        return hydrateCampaign(row);
    }

    public async save(campaign: Campaign): Promise<Campaign | null> {
        if (!campaign.isPersisted()) {
            throw new Error('Cannot save() a non-persisted Campaign. Use create() instead.');
        }
        const snap = campaign.persistenceSnapshot();
        const [row] = await this.db
            .update(campaignsTable)
            .set({
                coachId: snap.coachId,
                companyId: snap.companyId,
                name: snap.name,
                questionnaireId: snap.questionnaireId,
                status: snap.status,
                allowTestWithoutManualInputs: snap.allowTestWithoutManualInputs,
                startsAt: snap.startsAt,
                endsAt: snap.endsAt,
                updatedAt: sql`now()`,
            })
            .where(eq(campaignsTable.id, snap.id))
            .returning(SELECT_COLUMNS);
        return row ? hydrateCampaign(row) : null;
    }
}
