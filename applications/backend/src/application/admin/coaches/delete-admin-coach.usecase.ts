import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class DeleteAdminCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort & ICoachesWritePort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(coachId: number): Promise<void> {
        const coach = await this.ports.coaches.findById(coachId);
        if (!coach) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        const campaigns = await this.ports.campaigns.listAll({ coachId });
        if (campaigns.length > 0) {
            throw new AdminValidationError(
                'Impossible de supprimer : des campagnes sont encore rattachées à ce coach.'
            );
        }
        await this.ports.coaches.deleteById(coachId);
    }
}
