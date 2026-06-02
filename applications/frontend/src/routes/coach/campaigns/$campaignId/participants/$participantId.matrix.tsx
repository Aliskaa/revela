// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantMatrixPage } from '@/components/scoped/CampaignParticipantMatrixPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId/participants/$participantId/matrix')({
    component: CoachCampaignParticipantMatrixRoute,
});

function CoachCampaignParticipantMatrixRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <CampaignParticipantMatrixPage
            scope="coach"
            campaignId={Number(campaignId)}
            participantId={Number(participantId)}
        />
    );
}
