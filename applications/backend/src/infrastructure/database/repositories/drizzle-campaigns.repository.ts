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

import { DRIZZLE_DB_SYMBOL, type DrizzleDb, and, asc, campaignsTable, eq } from '@aor/drizzle';
import { Inject, Injectable } from '@nestjs/common';

import type { CampaignRecord, ICampaignsRepositoryPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

@Injectable()
export class DrizzleCampaignsRepository implements ICampaignsRepositoryPort {
    public constructor(@Inject(DRIZZLE_DB_SYMBOL) private readonly db: DrizzleDb) {}

    public async listAll(params?: { coachId?: number }): Promise<CampaignRecord[]> {
        const query = this.db
            .select({
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
            })
            .from(campaignsTable)
            .orderBy(asc(campaignsTable.id));
        if (params?.coachId) {
            return query.where(eq(campaignsTable.coachId, params.coachId));
        }
        return query;
    }

    public async findById(id: number, params?: { coachId?: number }): Promise<CampaignRecord | null> {
        const query = this.db
            .select({
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
            })
            .from(campaignsTable)
            .limit(1);
        const [campaign] =
            params?.coachId !== undefined
                ? await query.where(and(eq(campaignsTable.id, id), eq(campaignsTable.coachId, params.coachId)))
                : await query.where(eq(campaignsTable.id, id));
        return campaign ?? null;
    }

    public async findByCompanyAndName(companyId: number, name: string): Promise<CampaignRecord | null> {
        const [campaign] = await this.db
            .select({
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
            })
            .from(campaignsTable)
            .where(and(eq(campaignsTable.companyId, companyId), eq(campaignsTable.name, name)))
            .limit(1);
        return campaign ?? null;
    }

    public async create(input: {
        coachId: number;
        companyId: number;
        name: string;
        questionnaireId: string;
        status: 'draft' | 'active' | 'closed' | 'archived';
        allowTestWithoutManualInputs: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
    }): Promise<CampaignRecord> {
        const [created] = await this.db
            .insert(campaignsTable)
            .values({
                coachId: input.coachId,
                companyId: input.companyId,
                name: input.name,
                questionnaireId: input.questionnaireId,
                status: input.status,
                allowTestWithoutManualInputs: input.allowTestWithoutManualInputs,
                startsAt: input.startsAt,
                endsAt: input.endsAt,
            })
            .returning({
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
            });
        return created;
    }

    public async updateStatus(
        id: number,
        status: 'draft' | 'active' | 'closed' | 'archived',
        patch?: { startsAt?: Date }
    ): Promise<CampaignRecord | null> {
        const now = new Date();
        const baseSet = { status, updatedAt: now };
        const setPayload = patch?.startsAt !== undefined ? { ...baseSet, startsAt: patch.startsAt } : baseSet;
        const [updated] = await this.db
            .update(campaignsTable)
            .set(setPayload)
            .where(eq(campaignsTable.id, id))
            .returning({
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
            });
        return updated ?? null;
    }

    public async updateCoachId(id: number, coachId: number): Promise<CampaignRecord | null> {
        const now = new Date();
        const [updated] = await this.db
            .update(campaignsTable)
            .set({ coachId, updatedAt: now })
            .where(eq(campaignsTable.id, id))
            .returning({
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
            });
        return updated ?? null;
    }
}
