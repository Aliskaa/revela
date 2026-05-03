import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import type { ICampaignsWritePort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

export type DeleteAdminCoachResult = {
    /** Nombre de campagnes basculées vers le compte admin lors de la suppression. */
    reassignedCampaignsCount: number;
    /** Id du coach admin qui a hérité des campagnes (pour audit log). */
    reassignedToCoachId: number;
};

export class DeleteAdminCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort & ICoachesWritePort;
            readonly campaigns: ICampaignsWritePort;
            readonly authConfig: IAdminAuthConfigPort;
        }
    ) {}

    public async execute(coachId: number): Promise<DeleteAdminCoachResult> {
        const coach = await this.ports.coaches.findById(coachId);
        if (!coach) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        const adminCoach = await this.ports.coaches.findByUsername(this.ports.authConfig.superAdminUsername);
        if (!adminCoach) {
            throw new Error(
                'Compte coach Admin introuvable. EnsureAdminCoachService n\'a pas pu initialiser la ligne sentinelle.'
            );
        }
        if (coachId === adminCoach.id) {
            throw new AdminValidationError('Le compte admin ne peut pas être supprimé.');
        }
        const reassignedCampaignsCount = await this.ports.campaigns.reassignAllByCoach(coachId, adminCoach.id);
        await this.ports.coaches.deleteById(coachId);
        return { reassignedCampaignsCount, reassignedToCoachId: adminCoach.id };
    }
}
