// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { AdminCampaignDetailPage } from '@/components/admin/campaign-detail/AdminCampaignDetailPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId/')({
    component: AdminCampaignDetailRoute,
});

function AdminCampaignDetailRoute() {
    const { campaignId } = Route.useParams();
    return <AdminCampaignDetailPage campaignId={Number(campaignId)} />;
}
