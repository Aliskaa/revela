import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

export class ListAdminCampaignsUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(params: { coachId?: number }) {
        return this.ports.campaigns.listAll(params);
    }
}
