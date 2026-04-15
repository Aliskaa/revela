import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { CampaignRecord, ICampaignsReadPort, ICampaignsWritePort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class ReassignAdminCampaignCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort & ICampaignsWritePort;
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute(campaignId: number, coachId: number): Promise<CampaignRecord> {
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

        if (campaign.coachId === coachId) {
            return campaign;
        }

        const updated = await this.ports.campaigns.updateCoachId(campaignId, coachId);
        if (!updated) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        return updated;
    }
}
