import { useParticipantSession } from '@/hooks/participantSession';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import { useCampaignStore } from '@/stores/campaignStore';
import type { ParticipantSession } from '@aor/types';
import {
    Alert,
    Box,
    ButtonBase,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Brain, ClipboardList, Lock, MessageSquareQuote, Radar, Sparkles, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/journey')({
    component: ParticipantJourneyRoute,
});

type StepState = 'completed' | 'current' | 'locked';

type StepRoute = '/self-rating' | '/peer-feedback' | '/test' | '/results';

type JourneyStep = {
    label: string;
    subtitle: string;
    description: string;
    icon: React.ElementType;
    state: StepState;
    route: StepRoute | null;
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
        route: '/self-rating',
    },
    {
        label: 'Feedback des pairs',
        subtitle: 'Même logique de notation',
        description: 'Les pairs renseignent les short labels sur une échelle de 1 à 9 pour compléter la lecture.',
        icon: Users,
        route: '/peer-feedback',
    },
    {
        label: 'Test Élément Humain',
        subtitle: '2 × 54 questions',
        description: 'Le test consiste à répondre à deux séries de 54 questions pour chaque questionnaire B, F et S.',
        icon: Brain,
        route: '/test',
    },
    {
        label: 'Résultats',
        subtitle: 'Lecture des écarts et synthèse',
        description: 'Les résultats rassemblent les métriques, les écarts et les questions de restitution.',
        icon: Radar,
        route: '/results',
    },
    {
        label: 'Restitution coaching',
        subtitle: "Temps d'échange avec le coach",
        description: 'Le coach accompagne la mise en sens des résultats et prépare les prochaines questions utiles.',
        icon: MessageSquareQuote,
        route: null,
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
    return [
        { ...STEP_TEMPLATES[0], state: stepStateFromStatus(progression.self_rating_status) },
        { ...STEP_TEMPLATES[1], state: stepStateFromStatus(progression.peer_feedback_status) },
        { ...STEP_TEMPLATES[2], state: stepStateFromStatus(progression.element_humain_status) },
        { ...STEP_TEMPLATES[3], state: stepStateFromStatus(progression.results_status) },
        {
            ...STEP_TEMPLATES[4],
            state: progression.results_status === 'completed' ? ('current' as const) : ('locked' as const),
        },
    ];
};

function StepCard({ step, onNavigate }: { step: JourneyStep; onNavigate: (route: StepRoute) => void }) {
    const Icon = step.icon;
    const isClickable = step.state !== 'locked' && step.route !== null;
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

    if (isClickable && step.route !== null) {
        const route = step.route;
        return (
            <ButtonBase
                onClick={() => onNavigate(route)}
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

function ParticipantJourneyRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();
    const { assignment: selectedAssignment, index: selectedIndex, assignments } = useSelectedAssignment(session);
    const selectCampaign = useCampaignStore(s => s.select);
    const navigate = useNavigate();
    const steps = React.useMemo(() => buildSteps(selectedAssignment), [selectedAssignment]);
    const handleNavigate = React.useCallback(
        (route: StepRoute) => {
            navigate({ to: route });
        },
        [navigate]
    );

    if (isLoading) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement du parcours
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre parcours pour le moment.</Alert>;
    }

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
                                label="Parcours participant"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Mon parcours Révéla
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Cette page explique simplement le chemin du participant : auto-évaluation, feedback des
                                pairs, test, résultats et restitution.
                            </Typography>
                            {assignments.length > 1 && (
                                <FormControl size="small" sx={{ mt: 2, minWidth: 300 }}>
                                    <InputLabel>Campagne</InputLabel>
                                    <Select
                                        label="Campagne"
                                        value={selectedIndex}
                                        onChange={e => {
                                            const idx = e.target.value as number;
                                            const a = assignments[idx];
                                            if (a?.campaign_id != null) selectCampaign(a.campaign_id);
                                        }}
                                    >
                                        {assignments.map((a, i) => (
                                            <MenuItem key={`${a.campaign_id}-${a.questionnaire_id}`} value={i}>
                                                {a.campaign_name ?? 'Campagne'} —{' '}
                                                {a.questionnaire_title ?? a.questionnaire_id}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>

                        <Card variant="outlined" sx={{ width: { xs: '100%', sm: 340 } }}>
                            <CardContent sx={{ p: 2 }}>
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
                                    <Box>
                                        <Typography fontWeight={800} color="text.primary">
                                            Révéla
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Un parcours en 5 étapes
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
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
