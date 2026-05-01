// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CampaignsListPage } from '@/components/scoped/CampaignsListPage';

export const Route = createFileRoute('/coach/campaigns/')({
    component: () => <CampaignsListPage scope="coach" />,
});
