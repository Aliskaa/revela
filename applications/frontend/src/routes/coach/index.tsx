// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, MessageSquareText, Target, Users } from 'lucide-react';

import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useAdminResponses, useParticipants } from '@/hooks/admin';

export const Route = createFileRoute('/coach/')({
    component: CoachDashboardRoute,
});

/**
 * Dashboard coach. Les hooks `useAdminCampaigns` / `useAdminParticipants` / `useAdminResponses`
 * sont déjà filtrés côté backend par `coachId` (cf. étape 1.b — filtres scope=coach).
 * On reconstruit donc les KPIs à partir de la longueur des listes paginées plutôt que d'un
 * endpoint dashboard dédié (cf. avancement-2026-04-28.md §5.1 « Dashboard coach calculé côté
 * frontend »).
 */
function CoachDashboardRoute() {
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    // On ne lit que le `total` paginé, pas les items — perPage minimal pour économiser le payload.
    const { data: participantsPaged, isLoading: participantsLoading } = useParticipants(1, undefined, 1);
    const { data: responsesPaged, isLoading: responsesLoading } = useAdminResponses(undefined, 1, 1);

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Tableau de bord"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Mon espace coach
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Vue d'ensemble de vos campagnes, participants et soumissions. Vous ne voyez ici que les
                                données rattachées à votre périmètre de coaching.
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Mes campagnes"
                    value={campaigns.length}
                    helper="dans mon périmètre"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Actives"
                    value={activeCampaigns}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Mes participants"
                    value={participantsPaged?.total ?? 0}
                    helper="rattachés"
                    icon={Users}
                    loading={participantsLoading}
                />
                <StatCard
                    label="Mes réponses"
                    value={responsesPaged?.total ?? 0}
                    helper="collectées"
                    icon={MessageSquareText}
                    loading={responsesLoading}
                />
            </Box>
        </Stack>
    );
}
