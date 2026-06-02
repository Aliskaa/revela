// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, MessageSquareText, Target, Users } from 'lucide-react';

import { KpiCard } from '@/components/common/cards';
import { PageHeader, KpiGrid } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCampaigns, useAdminResponses, useParticipants } from '@/hooks/admin';
import { parseAdminJwtClaims } from '@/lib/auth';

export const Route = createFileRoute('/coach/')({
    component: CoachDashboardRoute,
});

/**
 * Dashboard coach. Les hooks `useAdminCampaigns` / `useAdminParticipants` / `useAdminResponses`
 * sont déjà filtrés côté backend par `coachId` (cf. étape 1.b — filtres scope=coach).
 * Pour un super-admin (qui peut accéder à cette vue), aucun filtrage n'est appliqué côté
 * backend : il voit donc l'intégralité, et les libellés sont adaptés en conséquence.
 */
function CoachDashboardRoute() {
    useBreadcrumbs([{ label: 'Tableau de bord' }]);

    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: participantsPaged, isLoading: participantsLoading } = useParticipants(1, undefined, 1);
    const { data: responsesPaged, isLoading: responsesLoading } = useAdminResponses(undefined, 1, 1);

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const isSuperAdmin = parseAdminJwtClaims()?.scope === 'super-admin';

    const title = isSuperAdmin ? "Vue coach (depuis l'admin)" : 'Mon espace coach';
    const subtitle = isSuperAdmin
        ? "Vue coach consultée depuis le compte admin. Vous voyez l'intégralité des campagnes, participants et réponses, sans restriction de périmètre."
        : 'Vue d\'ensemble de vos campagnes, participants et soumissions. Vous ne voyez ici que les données rattachées à votre périmètre de coaching.';
    const campaignsLabel = isSuperAdmin ? 'Campagnes' : 'Mes campagnes';
    const campaignsHelper = isSuperAdmin ? 'toutes' : 'dans mon périmètre';
    const participantsLabel = isSuperAdmin ? 'Participants' : 'Mes participants';
    const participantsHelper = isSuperAdmin ? 'tous' : 'rattachés';
    const responsesLabel = isSuperAdmin ? 'Réponses' : 'Mes réponses';
    const responsesHelper = isSuperAdmin ? 'toutes' : 'collectées';

    return (
        <Stack spacing={3}>
            <PageHeader title={title} subtitle={subtitle} />

            <KpiGrid columns={4}>
                <KpiCard
                    label={campaignsLabel}
                    value={campaigns.length}
                    helper={campaignsHelper}
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Actives"
                    value={activeCampaigns}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label={participantsLabel}
                    value={participantsPaged?.total ?? 0}
                    helper={participantsHelper}
                    icon={Users}
                    loading={participantsLoading}
                />
                <KpiCard
                    label={responsesLabel}
                    value={responsesPaged?.total ?? 0}
                    helper={responsesHelper}
                    icon={MessageSquareText}
                    loading={responsesLoading}
                />
            </KpiGrid>
        </Stack>
    );
}
