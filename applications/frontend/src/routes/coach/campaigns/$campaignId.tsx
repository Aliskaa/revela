// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignDetailPage } from '@/components/scoped/CampaignDetailPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId')({
    component: CoachCampaignDetailRoute,
});

function CoachCampaignDetailRoute() {
    const { campaignId } = Route.useParams();
    return <CampaignDetailPage scope="coach" campaignId={Number(campaignId)} />;
}
