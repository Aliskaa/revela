// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CompanyDetailPage } from '@/components/scoped/CompanyDetailPage';

export const Route = createFileRoute('/coach/companies/$companyId')({
    component: CoachCompanyDetailRoute,
});

function CoachCompanyDetailRoute() {
    const { companyId } = Route.useParams();
    return <CompanyDetailPage scope="coach" companyId={Number(companyId)} />;
}
