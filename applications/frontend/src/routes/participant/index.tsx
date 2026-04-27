// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { CampaignCard } from '@/components/participant-dashboard/CampaignCard';
import { CoachCard } from '@/components/participant-dashboard/CoachCard';
import { JourneyItem } from '@/components/participant-dashboard/JourneyItem';
import { MetricCard } from '@/components/participant-dashboard/MetricCard';
import { PageHeader } from '@/components/participant-dashboard/PageHeader';
import { useParticipantSession } from '@/hooks/participantSession';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import { buildCampaignView, buildEffortEstimate, buildJourney, buildMetrics } from '@/lib/participant/dashboardView';
import { useCampaignStore } from '@/stores/campaignStore';

export const Route = createFileRoute('/participant/')({
    component: ParticipantDashboardRoute,
});

export function ParticipantDashboardRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();
    const { assignment: selectedAssignment, index: selectedIndex, assignments } = useSelectedAssignment(session);
    const selectCampaign = useCampaignStore(s => s.select);

    const campaignView = React.useMemo(
        () => buildCampaignView(session, selectedAssignment),
        [session, selectedAssignment]
    );
    const journeyView = React.useMemo(() => buildJourney(selectedAssignment), [selectedAssignment]);
    const metricsView = React.useMemo(
        () => buildMetrics(campaignView, selectedAssignment),
        [campaignView, selectedAssignment]
    );
    const effort = React.useMemo(() => buildEffortEstimate(selectedAssignment), [selectedAssignment]);
    const participantFirstName = session?.first_name?.trim() || 'Participant';

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role="status"` (équivalent ARIA d'un live region) pour annoncer le chargement aux lecteurs d'écran.
            <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement de votre espace
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Récupération de votre campagne, de votre progression et de vos prochaines actions.
                    </Typography>
                    <LinearProgress aria-label="Chargement en cours" />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre espace participant pour le moment.</Alert>;
    }

    return (
        <Stack spacing={3}>
            <PageHeader
                campaignView={campaignView}
                participantFirstName={participantFirstName}
                assignments={assignments}
                selectedIndex={selectedIndex}
                onSelectIndex={idx => {
                    const a = assignments[idx];
                    if (a?.campaign_id !== null && a?.campaign_id !== undefined) {
                        selectCampaign(a.campaign_id);
                    }
                }}
                effort={effort}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                        xl: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                }}
            >
                {metricsView.map(metric => (
                    <MetricCard key={metric.label} metric={metric} progress={campaignView.progress} />
                ))}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1.4fr 0.9fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <Stack spacing={3}>
                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle
                                title="Parcours Révéla"
                                subtitle="Le flux reste lisible : terminé / en cours / verrouillé."
                            />
                            <Stack spacing={1.4}>
                                {journeyView.map(step => (
                                    <JourneyItem key={step.label} step={step} />
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                <Stack spacing={3}>
                    <CampaignCard campaignView={campaignView} />
                    <CoachCard campaignView={campaignView} />
                </Stack>
            </Box>
        </Stack>
    );
}
