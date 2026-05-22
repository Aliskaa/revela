// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack, TextField } from '@mui/material';
import { Building2, ClipboardList, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import { KpiCard } from '@/components/common/cards';
import { HarmonizedSearchField } from '@/components/common/forms/HarmonizedSearchField';
import {
    CoachScopedListCard,
    HarmonizedAdminPageHeader,
    HarmonizedListPanel,
    KpiGrid,
    PageHeroCard,
} from '@/components/common/layout';
import { useHarmonizedBreadcrumbs } from '@/components/layout/HarmonizedChromeContext';
import {
    CompanyListViews,
    type CompanySortKey,
    type CompanySortOrder,
} from '@/components/scoped/companies-list/CompanyListViews';
import { useAdminCampaigns, useCompanies, useCreateCompany } from '@/hooks/admin';
import { useTablePagination } from '@/lib/useTablePagination';

export type CompaniesListScope = 'admin' | 'coach';

export type CompaniesListPageProps = {
    scope: CompaniesListScope;
};

const SCOPE_LABELS: Record<
    CompaniesListScope,
    { eyebrow: string; title: string; subtitle: string; statsHelper: string; emptyMessage: string }
> = {
    admin: {
        eyebrow: 'Entreprises',
        title: 'Entreprises',
        subtitle:
            'Référentiel des entreprises clientes, avec leurs campagnes actives, leurs participants rattachés et leurs points de contact privilégiés.',
        statsHelper: 'référencées',
        emptyMessage: 'Aucune entreprise pour le moment.',
    },
    coach: {
        eyebrow: 'Mes entreprises',
        title: 'Entreprises rattachées',
        subtitle:
            'Référentiel des entreprises ayant au moins une de vos campagnes attribuées, avec leurs participants et leurs contacts.',
        statsHelper: 'rattachées',
        emptyMessage: 'Aucune entreprise rattachée à vos campagnes pour le moment.',
    },
};

/**
 * Liste d'entreprises — unifie `admin/companies` et `coach/companies`. Le filtrage par
 * coach est appliqué côté backend via `useCompanies`, donc ce composant reste agnostique
 * du scope sauf pour les libellés et les liens de détail.
 */
export function CompaniesListPage({ scope }: CompaniesListPageProps) {
    const isAdmin = scope === 'admin';
    useHarmonizedBreadcrumbs(isAdmin ? [{ label: 'Administration' }, { label: 'Entreprises' }] : []);
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = isAdmin ? '/admin/companies' : '/coach/companies';

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [sortKey, setSortKey] = React.useState<CompanySortKey>('name');
    const [sortOrder, setSortOrder] = React.useState<CompanySortOrder>('asc');

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCompany = useCreateCompany();

    const totalParticipants = React.useMemo(
        () => companies.reduce((sum, c) => sum + c.participant_count, 0),
        [companies]
    );
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const filtered = React.useMemo(() => {
        const base = search.trim()
            ? companies.filter(
                  c =>
                      c.name.toLowerCase().includes(search.toLowerCase()) ||
                      (c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
              )
            : companies;
        const direction = sortOrder === 'asc' ? 1 : -1;
        return [...base].sort((a, b) => {
            if (sortKey === 'participant_count') {
                return (a.participant_count - b.participant_count) * direction;
            }
            const av = (sortKey === 'name' ? a.name : (a.contact_name ?? '')).toLowerCase();
            const bv = (sortKey === 'name' ? b.name : (b.contact_name ?? '')).toLowerCase();
            return av.localeCompare(bv) * direction;
        });
    }, [companies, search, sortKey, sortOrder]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const handleSort = (key: CompanySortKey) => {
        if (sortKey === key) {
            setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const emptyMessage = search ? 'Aucune entreprise ne correspond à la recherche.' : labels.emptyMessage;

    const listViews = (
        <CompanyListViews
            variant={scope}
            companies={paged}
            campaigns={campaigns}
            isLoading={companiesLoading}
            isEmpty={filtered.length === 0}
            emptyMessage={emptyMessage}
            detailPathPrefix={detailPathPrefix}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={filtered.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
        />
    );

    const drawer = isAdmin ? (
        <AdminCompanyDrawerForm
            open={drawerOpen}
            mode="create"
            onClose={() => {
                setDrawerOpen(false);
                createCompany.reset();
            }}
            onSubmit={async values => {
                try {
                    await createCompany.mutateAsync({
                        name: values.name,
                        contactName: values.contactName || null,
                        contactEmail: values.contactEmail || null,
                    });
                    setDrawerOpen(false);
                } catch {
                    // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                }
            }}
        />
    ) : null;

    if (isAdmin) {
        return (
            <Stack spacing={4}>
                {drawer}
                <HarmonizedAdminPageHeader
                    title={labels.title}
                    subtitle={labels.subtitle}
                    action={{ label: 'Ajouter une entreprise', onClick: () => setDrawerOpen(true) }}
                />
                <KpiGrid columns={3}>
                    <KpiCard
                        label="Entreprises"
                        value={companies.length}
                        helper={labels.statsHelper}
                        icon={Building2}
                        loading={companiesLoading}
                    />
                    <KpiCard
                        label="Participants"
                        value={totalParticipants}
                        helper="rattachés aux campagnes"
                        icon={Users}
                        loading={companiesLoading}
                    />
                    <KpiCard
                        label="Campagnes"
                        value={activeCampaigns}
                        helper="projets de coaching en cours"
                        icon={ClipboardList}
                        loading={campaignsLoading}
                    />
                </KpiGrid>
                <HarmonizedListPanel
                    title="Liste des entreprises"
                    headerBorder
                    headerActions={
                        <>
                            <HarmonizedSearchField
                                value={search}
                                onChange={setSearch}
                                placeholder="Rechercher une entreprise…"
                                sx={{ flex: 1, minWidth: { sm: 280 }, width: 'auto' }}
                            />
                        </>
                    }
                >
                    {listViews}
                </HarmonizedListPanel>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <PageHeroCard eyebrow={labels.eyebrow} title={labels.title} subtitle={labels.subtitle} />
            <KpiGrid columns={3}>
                <KpiCard
                    label="Entreprises"
                    value={companies.length}
                    helper={labels.statsHelper}
                    icon={Building2}
                    loading={companiesLoading}
                />
                <KpiCard
                    label="Participants"
                    value={totalParticipants}
                    helper="rattachés"
                    icon={Users}
                    loading={companiesLoading}
                />
                <KpiCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="rattachées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </KpiGrid>
            <CoachScopedListCard
                title="Liste des entreprises"
                subtitle="Recherche rapide et accès au détail des campagnes associées."
                search={
                    <TextField
                        size="small"
                        placeholder="Rechercher une entreprise…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{ minWidth: 300 }}
                    />
                }
            >
                {listViews}
            </CoachScopedListCard>
        </Stack>
    );
}
