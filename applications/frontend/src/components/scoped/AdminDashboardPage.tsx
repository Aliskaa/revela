// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { Building2, ClipboardList, Target, UserRound, Users } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/common/Button';
import { KpiCard } from '@/components/common/cards';
import { PageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { AdminDashboardRecentCampaigns } from '@/components/scoped/admin-dashboard/AdminDashboardRecentCampaigns';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies } from '@/hooks/admin';

const RECENT_CAMPAIGNS_LIMIT = 5;

export function AdminDashboardPage() {
    useBreadcrumbs([{ label: 'Administration' }, { label: 'Tableau de bord' }]);
    const navigate = useNavigate();

    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();

    const isLoading = dashboardLoading || campaignsLoading || coachesLoading;

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const companyName = React.useCallback(
        (id: number) => companies.find(c => c.id === id)?.name ?? '–',
        [companies]
    );
    const companyAvatarUrl = React.useCallback(
        (id: number) => companies.find(c => c.id === id)?.avatar_url ?? null,
        [companies]
    );
    const coachName = React.useCallback(
        (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–',
        [coaches]
    );

    const recentCampaigns = React.useMemo(
        () =>
            [...campaigns]
                .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                .slice(0, RECENT_CAMPAIGNS_LIMIT),
        [campaigns]
    );

    return (
        <Stack spacing={3}>
            <PageHeader
                title="Tableau de bord"
                subtitle="Visualisez l'état des campagnes, des participants, des coachs et des entreprises en un coup d'œil."
                action={{
                    label: 'Nouvelle campagne',
                    onClick: () => navigate({ to: '/admin/campaigns' }),
                    icon: ClipboardList,
                }}
            />

            <KpiGrid columns={4}>
                <KpiCard
                    label="Campagnes actives"
                    value={activeCampaigns}
                    helper={`sur ${campaigns.length} campagne${campaigns.length !== 1 ? 's' : ''}`}
                    icon={Target}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Participants"
                    value={dashboard?.total_participants ?? '-'}
                    helper="accès ouverts"
                    icon={Users}
                    loading={dashboardLoading}
                />
                <KpiCard
                    label="Entreprises"
                    value={dashboard?.total_companies ?? '-'}
                    helper="clients suivis"
                    icon={Building2}
                    loading={dashboardLoading}
                />
                <KpiCard
                    label="Coachs"
                    value={coaches.length}
                    helper="utilisateurs actifs"
                    icon={UserRound}
                    loading={coachesLoading}
                />
            </KpiGrid>

            <ListPanel
                title="Suivi des campagnes"
                subtitle="Les 5 campagnes les plus récentes et leur état opérationnel."
                headerBorder
                headerActions={
                    <Link to="/admin/campaigns">
                        <Button appearance="secondary" sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
                            Voir toutes
                        </Button>
                    </Link>
                }
            >
                <AdminDashboardRecentCampaigns
                    campaigns={recentCampaigns}
                    isLoading={isLoading}
                    companyName={companyName}
                    companyAvatarUrl={companyAvatarUrl}
                    coachName={coachName}
                />
            </ListPanel>
        </Stack>
    );
}
