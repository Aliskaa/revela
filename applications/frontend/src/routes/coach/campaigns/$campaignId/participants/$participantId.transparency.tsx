// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantTransparencyPage } from '@/components/scoped/CampaignParticipantTransparencyPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId/participants/$participantId/transparency')({
    component: CoachCampaignParticipantTransparencyRoute,
});

function CoachCampaignParticipantTransparencyRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <CampaignParticipantTransparencyPage
            scope="coach"
            campaignId={Number(campaignId)}
            participantId={Number(participantId)}
        />
    );
}
