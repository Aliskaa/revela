import { randomBytes } from 'node:crypto';

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import { Invitation } from '@src/domain/invitations';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IParticipantsAdminReadPort,
    IParticipantsCampaignParticipationWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class InviteCampaignParticipantsUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly participants: IParticipantsAdminReadPort & IParticipantsCampaignParticipationWriterPort;
            readonly invitations: IInvitationsWritePort;
        }
    ) {}

    public async execute(campaignId: number, params: { participantIds?: number[] } = {}) {
        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        if (!campaign.questionnaireId) {
            throw new AdminValidationError('La campagne n’a pas de questionnaire associé.');
        }

        const companyParticipants = await this.ports.participants.listByCompanyId(campaign.companyId);

        // Si une sélection est fournie, on filtre — et on valide que chaque ID appartient bien
        // à l'entreprise de la campagne (sinon AdminValidationError).
        let participants = companyParticipants;
        if (params.participantIds !== undefined) {
            const requested = new Set(params.participantIds);
            const validIds = new Set(companyParticipants.map(p => p.id));
            for (const id of requested) {
                if (!validIds.has(id)) {
                    throw new AdminValidationError(
                        `Participant #${String(id)} n'appartient pas à l'entreprise de la campagne.`
                    );
                }
            }
            participants = companyParticipants.filter(p => requested.has(p.id));
        }

        let created = 0;
        for (const participant of participants) {
            await this.ports.invitations.create(
                Invitation.create({
                    token: randomBytes(32).toString('base64url'),
                    participantId: participant.id,
                    campaignId: campaign.id,
                    questionnaireId: campaign.questionnaireId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                })
            );
            await this.ports.participants.ensureCampaignParticipantInvited(campaign.id, participant.id);
            created += 1;
        }
        return { created };
    }
}
