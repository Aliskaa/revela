import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { CampaignStatus, ICampaignsWritePort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

export class UpdateAdminCampaignStatusUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsWritePort;
        }
    ) {}

    public async execute(
        campaignId: number,
        status: CampaignStatus,
        options?: { alignStartsAtToNow?: boolean }
    ) {
        if (!['draft', 'active', 'closed', 'archived'].includes(status)) {
            throw new AdminValidationError('status invalide.');
        }
        const patch =
            status === 'active' && options?.alignStartsAtToNow === true ? { startsAt: new Date() } : undefined;
        const updated = await this.ports.campaigns.updateStatus(campaignId, status, patch);
        if (!updated) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        return updated;
    }
}
