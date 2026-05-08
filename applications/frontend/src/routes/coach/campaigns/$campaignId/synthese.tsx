// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignSynthesisPage } from '@/components/scoped/CampaignSynthesisPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId/synthese')({
    component: CoachCampaignSyntheseRoute,
});

function CoachCampaignSyntheseRoute() {
    const { campaignId } = Route.useParams();
    return <CampaignSynthesisPage scope="coach" campaignId={Number(campaignId)} />;
}
