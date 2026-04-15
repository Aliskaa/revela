import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IParticipantsAdminReadPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesAdminListPort } from '@src/interfaces/responses/IResponsesRepository.port';

export class GetAdminCampaignDetailUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly participants: IParticipantsAdminReadPort;
            readonly responses: IResponsesAdminListPort;
        }
    ) {}

    public async execute(campaignId: number, params: { coachId?: number }) {
        const campaign = await this.ports.campaigns.findById(campaignId, params);
        if (!campaign) {
            return null;
        }
        const participantProgress = await this.ports.participants.listCampaignParticipantProgress(campaignId);
        const responses = await this.ports.responses.list({
            questionnaireId: campaign.questionnaireId ?? undefined,
            campaignId,
            page: 1,
            perPage: 100,
        });
        return {
            campaign,
            participant_progress: participantProgress,
            responses: responses.items,
            responses_total: responses.total,
        };
    }
}
