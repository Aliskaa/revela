// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { Campaign } from '@src/domain/campaigns';
import type { ICampaignsReadPort, ICampaignsWritePort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class ReassignAdminCampaignCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort & ICampaignsWritePort;
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute(campaignId: number, coachId: number): Promise<Campaign> {
        if (!Number.isFinite(coachId) || coachId <= 0) {
            throw new AdminValidationError('coach_id invalide.');
        }

        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }

        const coach = await this.ports.coaches.findById(coachId);
        if (!coach || !coach.isActive) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }

        const reassigned = campaign.reassignTo(coachId);
        if (reassigned === campaign) {
            return campaign;
        }

        const saved = await this.ports.campaigns.save(reassigned);
        if (!saved) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        return saved;
    }
}
