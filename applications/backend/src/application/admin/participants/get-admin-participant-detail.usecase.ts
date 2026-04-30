// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    IParticipantsAdminReadPort,
    ParticipantAdminListItem,
    ParticipantCampaignAssignmentItem,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export type AdminParticipantDetail = {
    participant: ParticipantAdminListItem;
    campaigns: ParticipantCampaignAssignmentItem[];
};

export class GetAdminParticipantDetailUseCase {
    public constructor(private readonly ports: { readonly participants: IParticipantsAdminReadPort }) {}

    public async execute(participantId: number, params: { coachId?: number }): Promise<AdminParticipantDetail | null> {
        const participant = await this.ports.participants.findByIdEnriched(participantId, params);
        if (!participant) {
            return null;
        }
        const campaigns = await this.ports.participants.listCampaignsForParticipant(participantId, params);
        return { participant, campaigns };
    }
}
