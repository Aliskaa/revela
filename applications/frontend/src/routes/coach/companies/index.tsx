// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { CompaniesListPage } from '@/components/scoped/CompaniesListPage';

export const Route = createFileRoute('/coach/companies/')({
    component: () => <CompaniesListPage scope="coach" />,
});
