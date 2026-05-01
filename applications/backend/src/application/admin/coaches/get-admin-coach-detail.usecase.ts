// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { Campaign } from '@src/domain/campaigns';
import type { Coach } from '@src/domain/coaches';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export type AdminCoachDetailResult = {
    coach: Coach;
    campaigns: Campaign[];
};

export class GetAdminCoachDetailUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(coachId: number): Promise<AdminCoachDetailResult> {
        const coach = await this.ports.coaches.findById(coachId);
        if (!coach) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        const campaigns = await this.ports.campaigns.listAll({ coachId });
        return { coach, campaigns };
    }
}
