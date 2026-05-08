// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignSynthesisPage } from '@/components/scoped/CampaignSynthesisPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId/synthese')({
    component: AdminCampaignSyntheseRoute,
});

function AdminCampaignSyntheseRoute() {
    const { campaignId } = Route.useParams();
    return <CampaignSynthesisPage scope="admin" campaignId={Number(campaignId)} />;
}
