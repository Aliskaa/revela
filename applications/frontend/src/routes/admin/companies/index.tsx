import { createFileRoute } from '@tanstack/react-router';

import { CompaniesListPage } from '@/components/scoped/CompaniesListPage';

export const Route = createFileRoute('/admin/companies/')({
    component: () => <CompaniesListPage scope="admin" />,
});
