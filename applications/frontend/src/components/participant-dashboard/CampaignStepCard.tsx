// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, Brain, ClipboardList, Lock, Users } from 'lucide-react';
import type { ElementType } from 'react';

import type { ParticipantSession } from '@aor/types';

export type CampaignStepState = 'completed' | 'current' | 'locked';

export type CampaignStepRouteKind = 'self-rating' | 'peer-feedback' | 'test' | 'results';

export type CampaignStep = {
    label: string;
    subtitle: string;
    description: string;
    icon: ElementType;
    state: CampaignStepState;
    routeKind: CampaignStepRouteKind | null;
};

type ParticipantAssignment = ParticipantSession['assignments'][number];

const stepStateFromStatus = (status?: 'locked' | 'pending' | 'completed'): CampaignStepState => {
    if (status === 'completed') return 'completed';
    if (status === 'pending') return 'current';
    return 'locked';
};

const STEP_TEMPLATES: ReadonlyArray<Omit<CampaignStep, 'state'>> = [
    {
        label: 'Auto-évaluation',
        subtitle: 'Notes de 1 à 9 sur les short labels',
        description: 'Vous devez noter chaque label de chaque dimension sur une échelle de 1 à 9.',
        icon: ClipboardList,
        routeKind: 'self-rating',
    },
    {
        label: 'Feedback des pairs',
        subtitle: 'Même logique de notation',
        description: "Vous pouvez noter jusqu'à 5 de vos pairs.",
        icon: Users,
        routeKind: 'peer-feedback',
    },
    {
        label: 'Test Élément Humain',
        subtitle: '2 séries de 54 questions',
        description: 'Vous devez répondre à deux séries de 54 questions.',
        icon: Brain,
        routeKind: 'test',
    },
];

export const buildCampaignSteps = (assignment?: ParticipantAssignment): CampaignStep[] => {
    // Tant que la campagne n'a pas été lancée par l'admin/le coach, le participant ne peut
    // commencer aucune étape — on force toutes les cards en `locked`. Le bandeau au-dessus
    // explique pourquoi (cf. ParticipantCampaignWorkspaceRoute).
    if (assignment && assignment.campaign_status !== 'active') {
        return STEP_TEMPLATES.map(t => ({ ...t, state: 'locked' as const }));
    }
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
    ];
};

export type CampaignStepCardProps = {
    step: CampaignStep;
    onNavigate: (routeKind: CampaignStepRouteKind) => void;
};

export function CampaignStepCard({ step, onNavigate }: CampaignStepCardProps) {
    const Icon = step.icon;
    const isClickable = step.state === 'current' && step.routeKind !== null;
    const chipLabel = step.state === 'completed' ? 'Terminé' : step.state === 'current' ? 'À faire' : 'Verrouillé';
    const chipSx =
        step.state === 'completed'
            ? { bgcolor: 'tint.successBg', color: 'tint.successText' }
            : step.state === 'current'
              ? { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }
              : { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' };
    const cta = step.state === 'current' ? 'Commencer cette étape' : null;

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
                {step.state === 'completed' && (
                    <Stack
                        direction="row"
                        spacing={0.7}
                        alignItems="center"
                        sx={{ mt: 1.2, color: 'tint.successText' }}
                    >
                        <Lock size={14} />
                        <Typography variant="body2">Étape terminée — réponses verrouillées.</Typography>
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
