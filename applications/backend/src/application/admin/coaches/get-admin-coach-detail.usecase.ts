import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { CampaignRecord, ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { CoachRecord, ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export type AdminCoachDetailResult = {
    coach: Omit<CoachRecord, 'password'>;
    campaigns: CampaignRecord[];
};

export class GetAdminCoachDetailUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(coachId: number): Promise<AdminCoachDetailResult> {
        const row = await this.ports.coaches.findById(coachId);
        if (!row) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        const { password: _password, ...coach } = row;
        const campaigns = await this.ports.campaigns.listAll({ coachId });
        return { coach, campaigns };
    }
}
