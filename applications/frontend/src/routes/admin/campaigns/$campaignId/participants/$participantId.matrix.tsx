// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantMatrixPage } from '@/components/scoped/CampaignParticipantMatrixPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId/participants/$participantId/matrix')({
    component: AdminCampaignParticipantMatrixRoute,
});

function AdminCampaignParticipantMatrixRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <CampaignParticipantMatrixPage
            scope="admin"
            campaignId={Number(campaignId)}
            participantId={Number(participantId)}
        />
    );
}
