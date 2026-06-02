// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Sparkles, Users } from 'lucide-react';
import * as React from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ListPanel, PageHeader } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignCoachAvatar } from '@/components/participant-dashboard/CampaignCoachAvatar';
import { useParticipantSession } from '@/hooks/participantSession';
import type { ParticipantSession } from '@aor/types';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/coach')({
    component: ParticipantCoachRoute,
});

type ParticipantAssignment = ParticipantSession['assignments'][number];

const COACH_SUBTITLE =
    'Votre coach référent accompagne la lecture des résultats et la préparation de la restitution de campagne.';

const coachAvailabilityLabel = (status?: ParticipantAssignment['campaign_status']): string =>
    status === 'active' ? 'Disponible' : 'En attente';

type CoachView = {
    name: string;
    avatarUrl: string | null;
    title: string;
    company: string;
    availability: string;
    bio: string;
    campaignName: string;
    questionnaire: string;
    feedback: string | null;
};

const coachFromAssignment = (assignment?: ParticipantAssignment): CoachView => ({
    name: assignment?.coach_name ?? 'Coach non attribué',
    avatarUrl: assignment?.coach_avatar_url ?? null,
    title: 'Coach référent Révéla',
    company: assignment?.company_name ?? 'Organisation non renseignée',
    availability: coachAvailabilityLabel(assignment?.campaign_status ?? undefined),
    campaignName: assignment?.campaign_name ?? 'Campagne',
    questionnaire: assignment?.questionnaire_title ?? assignment?.questionnaire_id ?? '–',
    bio: assignment?.coach_name
        ? 'Votre coach accompagne la lecture des résultats et la préparation de la restitution de campagne.'
        : "Aucun coach n'est encore rattaché à votre campagne participant.",
    feedback: assignment?.progression?.feedback_coach ?? null,
});

function InfoPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <Box sx={{ ...surfaceCardSx, p: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="start">
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: 'tint.secondaryBg',
                        color: 'tint.secondaryText',
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                    }}
                >
                    <Icon size={16} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

function ParticipantCoachRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const { data: session, isLoading, isError } = useParticipantSession();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const coachView = coachFromAssignment(assignment);
    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';
    const hasCoach = Boolean(assignment?.coach_name);

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Mon coach' },
    ]);

    if (isLoading) {
        return <LoadingCard title="Chargement de votre coach" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre coach pour le moment.</Alert>;
    }

    if (!assignment) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Aucune campagne trouvée pour cet identifiant.
                </Typography>
                <MuiLink component={Link} to="/campaigns" underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <PageHeader title="Mon coach" subtitle={COACH_SUBTITLE} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {campaignName} · {coachView.company}
                </Typography>
            </Box>

            <Card variant="outlined" sx={surfaceCardSx}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <CampaignCoachAvatar
                                coachName={coachView.name}
                                avatarUrl={coachView.avatarUrl}
                                size={48}
                            />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                    {coachView.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {coachView.title} · {coachView.company}
                                </Typography>
                            </Box>
                        </Stack>
                        <Typography
                            variant="caption"
                            sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 99,
                                bgcolor: 'tint.primaryBg',
                                color: 'primary.main',
                                fontWeight: 700,
                                alignSelf: { xs: 'flex-start', md: 'center' },
                            }}
                        >
                            {coachView.availability}
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>

            <ListPanel
                title="Profil du coach"
                subtitle="Rôle et cadre d'accompagnement pour la restitution de vos résultats."
                headerBorder
            >
                {!hasCoach ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={Sparkles}
                            variant="secondary"
                            title="Aucun coach attribué"
                            description="Aucun coach n'est encore rattaché à votre campagne. Vous serez informé dès qu'un référent sera assigné."
                        />
                    </Box>
                ) : (
                    <Stack spacing={2.5} sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
                        <Box sx={{ borderRadius: 2, bgcolor: 'surface.lavenderGrey', p: 2.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                {coachView.bio}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                                gap: 1.5,
                            }}
                        >
                            <InfoPill label="Rôle" value="Accompagnement / restitution" icon={Sparkles} />
                            <InfoPill label="Cadre" value="Confidentialité et lecture partagée" icon={Users} />
                        </Box>
                    </Stack>
                )}
            </ListPanel>
        </Stack>
    );
}
