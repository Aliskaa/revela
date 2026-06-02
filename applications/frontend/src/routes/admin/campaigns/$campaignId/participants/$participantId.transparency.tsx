// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantTransparencyPage } from '@/components/scoped/CampaignParticipantTransparencyPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId/participants/$participantId/transparency')({
    component: AdminCampaignParticipantTransparencyRoute,
});

function AdminCampaignParticipantTransparencyRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <CampaignParticipantTransparencyPage
            scope="admin"
            campaignId={Number(campaignId)}
            participantId={Number(participantId)}
        />
    );
}
