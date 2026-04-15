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

export const CAMPAIGNS_REPOSITORY_PORT_SYMBOL = Symbol('CAMPAIGNS_REPOSITORY_PORT_SYMBOL');

export type CampaignStatus = 'draft' | 'active' | 'closed' | 'archived';

export type CampaignRecord = {
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

export interface ICampaignsReadPort {
    listAll(params?: { coachId?: number }): Promise<CampaignRecord[]>;
    findById(id: number, params?: { coachId?: number }): Promise<CampaignRecord | null>;
    findByCompanyAndName(companyId: number, name: string): Promise<CampaignRecord | null>;
}

export interface ICampaignsWritePort {
    updateStatus(id: number, status: CampaignStatus, patch?: { startsAt?: Date }): Promise<CampaignRecord | null>;
    updateCoachId(id: number, coachId: number): Promise<CampaignRecord | null>;
    create(input: {
        coachId: number;
        companyId: number;
        name: string;
        questionnaireId: string;
        status: CampaignStatus;
        allowTestWithoutManualInputs: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
    }): Promise<CampaignRecord>;
}

export interface ICampaignsRepositoryPort extends ICampaignsReadPort, ICampaignsWritePort {}
