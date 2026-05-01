import { createFileRoute } from '@tanstack/react-router';

import { CompanyDetailPage } from '@/components/scoped/CompanyDetailPage';

export const Route = createFileRoute('/admin/companies/$companyId')({
    component: AdminCompanyDetailRoute,
});

function AdminCompanyDetailRoute() {
    const { companyId } = Route.useParams();
    return <CompanyDetailPage scope="admin" companyId={Number(companyId)} />;
}
