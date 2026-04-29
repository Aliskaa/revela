// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, Gauge, Hourglass, Layers3 } from 'lucide-react';
import type * as React from 'react';

import { useParticipantSession } from '@/hooks/participantSession';
import type { ParticipantSession } from '@aor/types';

export const Route = createFileRoute('/_participant/')({
    component: ParticipantDashboardRoute,
});

type ParticipantAssignment = ParticipantSession['assignments'][number];

const completedValue = (status?: 'locked' | 'pending' | 'completed') => (status === 'completed' ? 1 : 0);

const progressForAssignment = (assignment: ParticipantAssignment): number => {
    const progression = assignment.progression;
    if (!progression) {
        return 0;
    }
    const completed =
        completedValue(progression.self_rating_status) +
        completedValue(progression.peer_feedback_status) +
        completedValue(progression.element_humain_status) +
        completedValue(progression.results_status);
    return Math.round((completed / 4) * 100);
};

const statusLabel = (a: ParticipantAssignment): { label: string; sx: object } => {
    if (!a.invitation_confirmed) {
        return {
            label: 'Participation à confirmer',
            sx: { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' },
        };
    }
    if (a.campaign_status === 'active') {
        return { label: 'En cours', sx: { bgcolor: 'tint.successBg', color: 'tint.successText' } };
    }
    if (a.campaign_status === 'closed') {
        return { label: 'Terminée', sx: { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' } };
    }
    return { label: 'Brouillon', sx: { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' } };
};

type SummaryCardProps = {
    icon: React.ElementType;
    label: string;
    value: string;
    helper: string;
};

function SummaryCard({ icon: Icon, label, value, helper }: SummaryCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                            flex: 'none',
                        }}
                    >
                        <Icon size={20} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.1 }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {helper}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function CampaignSummaryRow({ assignment }: { assignment: ParticipantAssignment }) {
    const progress = progressForAssignment(assignment);
    const status = statusLabel(assignment);
    const name = assignment.campaign_name ?? 'Campagne sans nom';
    const company = assignment.company_name ?? 'Organisation non renseignée';
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'start', md: 'center' }}
                >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontWeight={800} color="text.primary">
                                {name}
                            </Typography>
                            <Chip label={status.label} size="small" sx={{ borderRadius: 99, ...status.sx }} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                            {company} · {assignment.questionnaire_title ?? assignment.questionnaire_id}
                        </Typography>
                        <Box sx={{ mt: 1.2 }}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Progression
                                </Typography>
                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                    {progress}%
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 99,
                                    bgcolor: 'tint.subtleBg',
                                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                                }}
                            />
                        </Box>
                    </Box>
                    <Link to="/campaigns/$campaignId" params={{ campaignId: String(assignment.campaign_id) }}>
                        <Button component="a" variant="outlined" size="small" endIcon={<ArrowRight size={14} />} sx={{ borderRadius: 3, alignSelf: { xs: 'stretch', md: 'center' } }}>
                            Ouvrir
                        </Button>
                    </Link>
                </Stack>
            </CardContent>
        </Card>
    );
}

export function ParticipantDashboardRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role="status"` pour annoncer le chargement aux lecteurs d'écran.
            <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement de votre espace
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} aria-label="Chargement en cours" />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre espace participant pour le moment.</Alert>;
    }

    const assignments = session.assignments;
    const total = assignments.length;
    const active = assignments.filter(a => a.campaign_status === 'active').length;
    const toConfirm = assignments.filter(a => a.campaign_status === 'active' && !a.invitation_confirmed).length;
    const completed = assignments.filter(a => a.progression?.results_status === 'completed').length;
    const averageProgress =
        total === 0 ? 0 : Math.round(assignments.reduce((acc, a) => acc + progressForAssignment(a), 0) / total);
    const participantFirstName = session.first_name?.trim() || 'Participant';

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', md: 'center' }}
                    >
                        <Box>
                            <Chip
                                label="Espace participant"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Bonjour {participantFirstName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                                Voici un aperçu rapide de vos campagnes et de leur avancement.
                            </Typography>
                        </Box>
                        <Button
                            component={Link}
                            to="/campaigns"
                            variant="contained"
                            disableElevation
                            endIcon={<ArrowRight size={14} />}
                            sx={{ borderRadius: 3 }}
                        >
                            Voir mes campagnes
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        lg: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                }}
            >
                <SummaryCard
                    icon={Layers3}
                    label="Mes campagnes"
                    value={String(total)}
                    helper="rattachées à votre compte"
                />
                <SummaryCard icon={Gauge} label="En cours" value={String(active)} helper="campagnes actives" />
                <SummaryCard
                    icon={Hourglass}
                    label="À confirmer"
                    value={String(toConfirm)}
                    helper="participations en attente"
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Progression moyenne"
                    value={`${averageProgress}%`}
                    helper={`${completed}/${total || 0} parcours terminés`}
                />
            </Box>

            {total === 0 ? (
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                            Aucune campagne pour le moment
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                            Les campagnes apparaissent ici dès qu'un coach vous y invite.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={1.4}>
                    {assignments.map(a => (
                        <CampaignSummaryRow key={`${a.campaign_id}-${a.questionnaire_id}`} assignment={a} />
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
