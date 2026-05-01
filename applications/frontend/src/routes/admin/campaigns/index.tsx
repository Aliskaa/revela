import { createFileRoute } from '@tanstack/react-router';

import { CampaignsListPage } from '@/components/scoped/CampaignsListPage';

export const Route = createFileRoute('/admin/campaigns/')({
    component: () => <CampaignsListPage scope="admin" />,
});
