// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack, TextField } from '@mui/material';
import { ClipboardList, Sparkles, Target, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCampaignDrawerForm } from '@/components/admin/AdminCampaignDrawerForm';
import { KpiCard } from '@/components/common/cards';
import { SearchField } from '@/components/common/forms/SearchField';
import { AdminPageHeader, CoachScopedListCard, KpiGrid, ListPanel, PageHeroCard } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignListViews } from '@/components/scoped/campaigns-list/CampaignListViews';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies, useCreateAdminCampaign } from '@/hooks/admin';
import { parseAdminJwtClaims } from '@/lib/auth';
import { useTablePagination } from '@/lib/useTablePagination';

export type CampaignsListScope = 'admin' | 'coach';

export type CampaignsListPageProps = {
    scope: CampaignsListScope;
};

const SCOPE_LABELS: Record<
    CampaignsListScope,
    { eyebrow: string; title: string; subtitle: string; statsLabel: string; statsHelper: string }
> = {
    admin: {
        eyebrow: 'Campagnes',
        title: 'Campagnes',
        subtitle:
            'Visualisez les campagnes existantes, leur statut et leur progression en temps réel pour optimiser le coaching opérationnel.',
        statsLabel: 'Campagnes',
        statsHelper: 'dans le système',
    },
    coach: {
        eyebrow: 'Mes campagnes',
        title: 'Campagnes attribuées',
        subtitle:
            'Toutes les campagnes que vous accompagnez. Cliquez sur « Détail » pour ouvrir leur cockpit (participants, soumissions, statut).',
        statsLabel: 'Mes campagnes',
        statsHelper: 'dans mon périmètre',
    },
};

/**
 * Liste de campagnes — unifie `admin/campaigns` et `coach/campaigns`. Le scope contrôle :
 *  - les libellés (eyebrow, titre, sous-titre, stats) ;
 *  - le préfixe de lien vers le détail (`/admin/campaigns/$id` vs `/coach/campaigns/$id`) ;
 *  - l'affichage de la colonne « Coach » (admin uniquement) ;
 *  - le pré-remplissage `lockedCoachId` côté coach via les claims JWT ;
 *  - le KPI « Participants » (admin) vs « Entreprises » (coach).
 */
export function CampaignsListPage({ scope }: CampaignsListPageProps) {
    const isAdmin = scope === 'admin';
    useBreadcrumbs(isAdmin ? [{ label: 'Administration' }, { label: 'Campagnes' }] : []);
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = isAdmin ? '/admin/campaigns' : '/coach/campaigns';

    const [search, setSearch] = React.useState('');
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const createCampaign = useCreateAdminCampaign();
    const claims = parseAdminJwtClaims();
    const lockedCoachId = !isAdmin && claims?.scope === 'coach' ? claims.coachId : undefined;

    const isLoading = campaignsLoading || (isAdmin && coachesLoading);
    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const coachName = (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–';
    const questionnairesUsed = new Set(campaigns.map(c => c.questionnaireId).filter(Boolean)).size;
    const activeCount = campaigns.filter(c => c.status === 'active').length;

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        return campaigns.filter(c => {
            const company = companies.find(co => co.id === c.companyId)?.name ?? '';
            const coach = coaches.find(co => co.id === c.coachId)?.displayName ?? '';
            const matchesScope = isAdmin
                ? company.toLowerCase().includes(q) || coach.toLowerCase().includes(q)
                : company.toLowerCase().includes(q);
            return c.name.toLowerCase().includes(q) || matchesScope;
        });
    }, [campaigns, coaches, companies, isAdmin, search]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const emptyMessage = search ? 'Aucune campagne ne correspond à la recherche.' : 'Aucune campagne pour le moment.';

    const listViews = (
        <CampaignListViews
            variant={scope}
            campaigns={paged}
            isLoading={isLoading}
            isEmpty={filtered.length === 0}
            emptyMessage={emptyMessage}
            detailPathPrefix={detailPathPrefix}
            companyName={companyName}
            coachName={coachName}
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={filtered.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
        />
    );

    const drawer = isAdmin ? (
        <AdminCampaignDrawerForm
            open={drawerOpen}
            mode="create"
            lockedCoachId={lockedCoachId}
            onClose={() => {
                setDrawerOpen(false);
                createCampaign.reset();
            }}
            onSubmit={async values => {
                try {
                    await createCampaign.mutateAsync({
                        name: values.name,
                        companyId: values.companyId,
                        coachId: values.coachId,
                        questionnaireId: values.questionnaireId,
                        startsAt: values.startDate ? new Date(values.startDate).toISOString() : null,
                        endsAt: values.endDate ? new Date(values.endDate).toISOString() : null,
                        allowTestWithoutManualInputs: values.allowTestWithoutManualInputs,
                        status: values.status,
                    });
                    setDrawerOpen(false);
                } catch {
                    // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                }
            }}
            isSubmitting={createCampaign.isPending}
        />
    ) : null;

    if (isAdmin) {
        return (
            <Stack spacing={4}>
                {drawer}
                <AdminPageHeader
                    title={labels.title}
                    subtitle={labels.subtitle}
                    action={{ label: 'Nouvelle campagne', onClick: () => setDrawerOpen(true) }}
                />
                <KpiGrid columns={4}>
                    <KpiCard
                        label={labels.statsLabel}
                        value={campaignsLoading ? '–' : campaigns.length}
                        helper={labels.statsHelper}
                        icon={ClipboardList}
                    />
                    <KpiCard
                        label="Actives"
                        value={campaignsLoading ? '–' : activeCount}
                        helper="en cours"
                        icon={Target}
                    />
                    <KpiCard
                        label="Participants"
                        value={dashboardLoading ? '–' : (dashboard?.total_participants ?? '–')}
                        helper="rattachés"
                        icon={Users}
                    />
                    <KpiCard
                        label="Questionnaires"
                        value={campaignsLoading ? '–' : questionnairesUsed}
                        helper="B / F / S"
                        icon={Sparkles}
                    />
                </KpiGrid>
                <ListPanel
                    title="Liste des campagnes"
                    headerBorder
                    headerActions={
                        <SearchField value={search} onChange={setSearch} placeholder="Rechercher une campagne…" />
                    }
                >
                    {listViews}
                </ListPanel>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <PageHeroCard eyebrow={labels.eyebrow} title={labels.title} subtitle={labels.subtitle} />
            <KpiGrid columns={4}>
                <KpiCard
                    label={labels.statsLabel}
                    value={campaigns.length}
                    helper={labels.statsHelper}
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Actives"
                    value={campaigns.filter(c => c.status === 'active').length}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Entreprises"
                    value={new Set(campaigns.map(c => c.companyId)).size}
                    helper="rattachées"
                    icon={Users}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Questionnaires"
                    value={questionnairesUsed}
                    helper="B / F / S"
                    icon={Sparkles}
                    loading={campaignsLoading}
                />
            </KpiGrid>
            <CoachScopedListCard
                title="Liste des campagnes"
                search={
                    <TextField
                        size="small"
                        placeholder="Rechercher…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{ minWidth: 260 }}
                    />
                }
            >
                {listViews}
            </CoachScopedListCard>
        </Stack>
    );
}
