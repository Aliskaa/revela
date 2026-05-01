// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignDetailPage } from '@/components/scoped/CampaignDetailPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId')({
    component: AdminCampaignDetailRoute,
});

function AdminCampaignDetailRoute() {
    const { campaignId } = Route.useParams();
    return <CampaignDetailPage scope="admin" campaignId={Number(campaignId)} />;
}
