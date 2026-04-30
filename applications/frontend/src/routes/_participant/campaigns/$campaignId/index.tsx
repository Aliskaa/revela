import { CampaignResultCard } from '@/components/participant-dashboard/CampaignResultCard';
import {
    CampaignStepCard,
    type CampaignStepRouteKind,
    buildCampaignSteps,
} from '@/components/participant-dashboard/CampaignStepCard';
import { CampaignWorkspaceHeader } from '@/components/participant-dashboard/CampaignWorkspaceHeader';
import { useParticipantSession } from '@/hooks/participantSession';
import { Alert, Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, MessageSquareQuote, Radar } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/')({
    component: ParticipantCampaignWorkspaceRoute,
});

function ParticipantCampaignWorkspaceRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const { data: session, isLoading, isError } = useParticipantSession();
    const navigate = useNavigate();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const steps = React.useMemo(() => buildCampaignSteps(assignment), [assignment]);

    const resultsLocked = React.useMemo(() => {
        const progression = assignment?.progression;
        if (!progression) return true;
        return (
            progression.self_rating_status !== 'completed' &&
            progression.peer_feedback_status !== 'completed' &&
            progression.element_humain_status !== 'completed'
        );
    }, [assignment]);

    const coachFeedbackLocked = assignment?.progression?.feedback_coach == null;

    const handleNavigate = React.useCallback(
        (routeKind: CampaignStepRouteKind) => {
            if (!Number.isFinite(campaignId)) return;
            if (routeKind === 'results') {
                navigate({
                    to: '/campaigns/$campaignId/results',
                    params: { campaignId: String(campaignId) },
                });
                return;
            }
            navigate({ to: `/${routeKind}` });
        },
        [navigate, campaignId]
    );

    if (isLoading) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement de la campagne
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger la campagne pour le moment.</Alert>;
    }

    if (!assignment) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">Aucune campagne trouvée pour cet identifiant.</Alert>
                <Button
                    component={Link}
                    to="/campaigns"
                    startIcon={<ArrowLeft size={16} />}
                    variant="outlined"
                    sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                >
                    Retour aux campagnes
                </Button>
            </Stack>
        );
    }

    const campaignName = assignment.campaign_name ?? 'Campagne';
    const company = assignment.company_name ?? 'Organisation non renseignée';
    const coachName = assignment.coach_name ?? 'Coach non attribué';
    const questionnaire = assignment.questionnaire_title ?? assignment.questionnaire_id;

    return (
        <Stack spacing={3}>
            <Button
                component={Link}
                to="/campaigns"
                startIcon={<ArrowLeft size={16} />}
                sx={{
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                }}
                disableRipple
            >
                Retour aux campagnes
            </Button>

            <CampaignWorkspaceHeader
                campaignId={campaignId}
                campaignName={campaignName}
                company={company}
                questionnaire={questionnaire}
                coachName={coachName}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Les étapes du parcours
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                            Le participant avance dans cet ordre, avec des étapes verrouillées tant que les prérequis ne
                            sont pas remplis.
                        </Typography>
                        <Stack spacing={1.4} sx={{ mt: 2 }}>
                            {steps.map(step => (
                                <CampaignStepCard key={step.label} step={step} onNavigate={handleNavigate} />
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Les résultats du parcours
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                            Les résultats sont consultables dès qu'au moins une donnée a été produite.
                        </Typography>
                        <Stack spacing={1.4} sx={{ mt: 2 }}>
                            <CampaignResultCard
                                label="Résultats"
                                subtitle="Consultation des résultats"
                                description="Les résultats sont consultables si au moins une étape a été terminée."
                                icon={Radar}
                                locked={resultsLocked}
                                lockedHint="Résultats disponibles une fois au moins une étape terminée."
                                cta="Voir les résultats"
                                ariaLabel="Résultats — Voir les résultats"
                                onClick={() =>
                                    navigate({
                                        to: '/campaigns/$campaignId/results',
                                        params: { campaignId: String(campaignId) },
                                    })
                                }
                            />
                            <CampaignResultCard
                                label="Retours du coach"
                                subtitle="Consultation des retours du coach"
                                description="Les retours du coach sont consultables si au moins une étape a été terminée."
                                icon={MessageSquareQuote}
                                locked={coachFeedbackLocked}
                                lockedHint="Retours du coach disponibles une fois au moins une étape terminée."
                                cta="Voir les retours du coach"
                                ariaLabel="Retours du coach — Voir les retours du coach"
                                onClick={() =>
                                    navigate({
                                        to: '/campaigns/$campaignId/coach',
                                        params: { campaignId: String(campaignId) },
                                    })
                                }
                            />
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
