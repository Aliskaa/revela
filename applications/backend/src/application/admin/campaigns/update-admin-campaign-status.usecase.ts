// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { Campaign } from '@src/domain/campaigns';
import type {
    CampaignStatus,
    ICampaignsReadPort,
    ICampaignsWritePort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';

const VALID_STATUSES: readonly CampaignStatus[] = ['draft', 'active', 'closed', 'archived'] as const;

export class UpdateAdminCampaignStatusUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort & ICampaignsWritePort;
        }
    ) {}

    public async execute(
        campaignId: number,
        status: CampaignStatus,
        options?: { alignStartsAtToNow?: boolean }
    ): Promise<Campaign> {
        if (!(VALID_STATUSES as readonly string[]).includes(status)) {
            throw new AdminValidationError('status invalide.');
        }
        const current = await this.ports.campaigns.findById(campaignId);
        if (!current) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        const next = current.transitionTo(status, {
            alignStartsAtToNow:
                status === 'active' && options?.alignStartsAtToNow === true ? new Date() : undefined,
        });
        const saved = await this.ports.campaigns.save(next);
        if (!saved) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        return saved;
    }
}
