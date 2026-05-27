// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Divider, Stack, Typography } from '@mui/material';
import { Building2, ClipboardList, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import { KpiCard } from '@/components/common/cards';
import { SearchField } from '@/components/common/forms/SearchField';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
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
    { title: string; subtitle: string; statsHelper: string; emptyMessage: string }
> = {
    admin: {
        title: 'Entreprises',
        subtitle:
            'Référentiel des entreprises clientes, avec leurs campagnes actives, leurs participants rattachés et leurs points de contact privilégiés.',
        statsHelper: 'référencées',
        emptyMessage: 'Aucune entreprise pour le moment.',
    },
    coach: {
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
    useBreadcrumbs(isAdmin ? [{ label: 'Administration' }, { label: 'Entreprises' }] : [{ label: 'Entreprises' }]);
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

    const displayFrom = filtered.length === 0 ? 0 : page * rowsPerPage + 1;
    const displayTo = filtered.length === 0 ? 0 : Math.min((page + 1) * rowsPerPage, filtered.length);

    const listViews = (
        <CompanyListViews
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
            isSubmitting={createCompany.isPending}
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

    return (
        <Stack spacing={3}>
            { isAdmin ? drawer : null}
            <AdminPageHeader
                title={labels.title}
                subtitle={labels.subtitle}
                action={isAdmin ? {
                    label: 'Ajouter une entreprise',
                    onClick: () => setDrawerOpen(true),
                    icon: Building2,
                } : undefined}
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
                <ListPanel
                    title="Liste des entreprises"
                    headerBorder
                    headerActions={
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <SearchField value={search} onChange={setSearch} placeholder="Rechercher une entreprise…" />
                            {filtered.length > 0 ? (
                                <>
                                    <Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'surface.lavenderGrey' }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap' }}
                                    >
                                        Affichage {displayFrom}–{displayTo} sur {filtered.length}
                                    </Typography>
                                </>
                            ) : null}
                        </Stack>
                    }
                >
                    {listViews}
                </ListPanel>
        </Stack>
    );
}
