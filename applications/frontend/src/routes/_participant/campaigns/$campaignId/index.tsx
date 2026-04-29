import { useParticipantSession } from '@/hooks/participantSession';
import type { ParticipantSession } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    ClipboardList,
    Lock,
    MessageSquareQuote,
    Radar,
    Sparkles,
    Users,
} from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/')({
    component: ParticipantCampaignWorkspaceRoute,
});

type StepState = 'completed' | 'current' | 'locked';

type StepRouteKind = 'self-rating' | 'peer-feedback' | 'test' | 'results';

type JourneyStep = {
    label: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    state: StepState;
    routeKind: StepRouteKind | null;
};

type ParticipantAssignment = ParticipantSession['assignments'][number];

const stepStateFromStatus = (status?: 'locked' | 'pending' | 'completed'): StepState => {
    if (status === 'completed') return 'completed';
    if (status === 'pending') return 'current';
    return 'locked';
};

const STEP_TEMPLATES: ReadonlyArray<Omit<JourneyStep, 'state'>> = [
    {
        label: 'Auto-évaluation',
        subtitle: 'Notes de 1 à 9 sur les short labels',
        description: 'Le participant note chaque short label de chaque dimension sur une échelle de 1 à 9.',
        icon: ClipboardList,
        routeKind: 'self-rating',
    },
    {
        label: 'Feedback des pairs',
        subtitle: 'Même logique de notation',
        description: 'Les pairs renseignent les short labels sur une échelle de 1 à 9 pour compléter la lecture.',
        icon: Users,
        routeKind: 'peer-feedback',
    },
    {
        label: 'Test Élément Humain',
        subtitle: '2 séries de 54 questions',
        description: 'Le test consiste à répondre à deux séries de 54 questions pour chaque questionnaire B, F et S.',
        icon: Brain,
        routeKind: 'test',
    },
    {
        label: 'Résultats',
        subtitle: 'Lecture des écarts et synthèse',
        description: 'Les résultats rassemblent les métriques, les écarts et les questions de restitution.',
        icon: Radar,
        routeKind: 'results',
    },
    {
        label: 'Restitution coaching',
        subtitle: "Temps d'échange avec le coach",
        description: 'Le coach accompagne la mise en sens des résultats et prépare les prochaines questions utiles.',
        icon: MessageSquareQuote,
        routeKind: null,
    },
];

const buildSteps = (assignment?: ParticipantAssignment): JourneyStep[] => {
    const progression = assignment?.progression;
    if (!progression) {
        return STEP_TEMPLATES.map((t, i) => ({
            ...t,
            state:
                i <= 1 && assignment
                    ? ('current' as const)
                    : i === 2 && assignment?.allow_test_without_manual_inputs
                        ? ('current' as const)
                        : ('locked' as const),
        }));
    }
    // Les résultats sont consultables dès qu'au moins une donnée a été produite.
    const hasAnyData =
        progression.self_rating_status === 'completed' ||
        progression.peer_feedback_status === 'completed' ||
        progression.element_humain_status === 'completed';
    const resultsState: StepState =
        progression.results_status === 'completed'
            ? 'completed'
            : hasAnyData
                ? 'current'
                : stepStateFromStatus(progression.results_status);
    return [
        { ...STEP_TEMPLATES[0], state: stepStateFromStatus(progression.self_rating_status) },
        { ...STEP_TEMPLATES[1], state: stepStateFromStatus(progression.peer_feedback_status) },
        { ...STEP_TEMPLATES[2], state: stepStateFromStatus(progression.element_humain_status) },
        { ...STEP_TEMPLATES[3], state: resultsState },
        {
            ...STEP_TEMPLATES[4],
            state: progression.results_status === 'completed' ? ('current' as const) : ('locked' as const),
        },
    ];
};

function StepCard({ step, onNavigate }: { step: JourneyStep; onNavigate: (routeKind: StepRouteKind) => void }) {
    const Icon = step.icon;
    const isClickable = step.state !== 'locked' && step.routeKind !== null;
    const chipLabel = step.state === 'completed' ? 'Terminé' : step.state === 'current' ? 'À faire' : 'Verrouillé';
    const chipSx =
        step.state === 'completed'
            ? { bgcolor: 'tint.successBg', color: 'tint.successText' }
            : step.state === 'current'
                ? { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }
                : { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' };
    const cta =
        step.state === 'completed' ? 'Revoir cette étape' : step.state === 'current' ? 'Commencer cette étape' : null;

    const content = (
        <Stack direction="row" spacing={1.5} alignItems="start" sx={{ width: '100%' }}>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 4,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                    ...(step.state === 'completed'
                        ? { bgcolor: 'tint.successBg', color: 'tint.successText' }
                        : step.state === 'current'
                            ? { bgcolor: 'rgba(255,204,0,0.14)', color: 'tint.secondaryText' }
                            : { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }),
                }}
            >
                <Icon size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                >
                    <Box>
                        <Typography fontWeight={700} color="text.primary">
                            {step.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {step.subtitle}
                        </Typography>
                    </Box>
                    <Chip label={chipLabel} size="small" sx={{ borderRadius: 99, ...chipSx }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                    {step.description}
                </Typography>
                {cta && isClickable && (
                    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 1.2, color: 'primary.main' }}>
                        <Typography variant="body2" fontWeight={700}>
                            {cta}
                        </Typography>
                        <ArrowRight size={14} />
                    </Stack>
                )}
                {step.state === 'locked' && (
                    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 1.2, color: 'text.disabled' }}>
                        <Lock size={14} />
                        <Typography variant="body2">Étape disponible une fois la précédente terminée.</Typography>
                    </Stack>
                )}
            </Box>
        </Stack>
    );

    if (isClickable && step.routeKind !== null) {
        const routeKind = step.routeKind;
        return (
            <ButtonBase
                onClick={() => onNavigate(routeKind)}
                focusRipple
                aria-label={`${step.label} — ${cta ?? ''}`}
                sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: 4,
                    p: 2,
                    bgcolor: '#fff',
                    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 6px 18px -10px rgba(15,23,42,0.18)',
                    },
                    '&:focus-visible': {
                        borderColor: 'primary.main',
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: 2,
                    },
                }}
            >
                {content}
            </ButtonBase>
        );
    }

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'border',
                borderRadius: 4,
                p: 2,
                bgcolor: step.state === 'locked' ? 'tint.mutedBg' : '#fff',
                opacity: step.state === 'locked' ? 0.85 : 1,
            }}
        >
            {content}
        </Box>
    );
}

function ParticipantCampaignWorkspaceRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const { data: session, isLoading, isError } = useParticipantSession();
    const navigate = useNavigate();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const steps = React.useMemo(() => buildSteps(assignment), [assignment]);

    const handleNavigate = React.useCallback(
        (routeKind: StepRouteKind) => {
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
                                label="Campagne"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {campaignName}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                {company} · {questionnaire}
                            </Typography>
                        </Box>

                        <Link to="/campaigns/$campaignId/coach" params={{ campaignId: String(campaignId) }}>
                            <ButtonBase
                                focusRipple
                                sx={{
                                    width: { xs: '100%', sm: 340 },
                                    textAlign: 'left',
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'border',
                                    bgcolor: '#fff',
                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: '0 6px 18px -10px rgba(15,23,42,0.18)',
                                    },
                                }}
                            >
                                <Box sx={{ p: 2, width: '100%' }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 4,
                                                bgcolor: 'primary.main',
                                                color: '#fff',
                                                display: 'grid',
                                                placeItems: 'center',
                                            }}
                                        >
                                            <Sparkles size={20} />
                                        </Box>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Mon coach
                                            </Typography>
                                            <Typography fontWeight={800} color="text.primary">
                                                {coachName}
                                            </Typography>
                                        </Box>
                                        <ArrowRight size={16} />
                                    </Stack>
                                </Box>
                            </ButtonBase>
                        </Link>
                    </Stack>
                </CardContent>
            </Card>

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
                            <StepCard key={step.label} step={step} onNavigate={handleNavigate} />
                        ))}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
