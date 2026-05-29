// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, ClipboardList, Hourglass, Sparkles, Target } from 'lucide-react';

import { KpiCard } from '@/components/common/cards';
import { RowNavigateHint } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/EmptyState';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { listRowSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
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
        completedValue(progression.element_humain_status);
    return Math.round((completed / 3) * 100);
};

const isAssignmentCompleted = (assignment: ParticipantAssignment): boolean => {
    const progression = assignment.progression;
    if (!progression) return false;
    return (
        progression.self_rating_status === 'completed' &&
        progression.peer_feedback_status === 'completed' &&
        progression.element_humain_status === 'completed'
    );
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

function CampaignSummaryRow({ assignment }: { assignment: ParticipantAssignment }) {
    const progress = progressForAssignment(assignment);
    const status = statusLabel(assignment);
    const name = assignment.campaign_name ?? 'Campagne sans nom';
    const company = assignment.company_name ?? 'Organisation non renseignée';

    const detailTo = `/campaigns/${assignment.campaign_id}`;

    return (
        <Box
            component={Link}
            to={detailTo}
            aria-label={`Ouvrir ${name}`}
            sx={{
                display: 'block',
                px: { xs: 2.5, md: 4 },
                py: 3,
                borderBottom: '1px solid',
                borderColor: 'surface.lavenderGrey',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
                ...listRowSx,
                '&:last-child': { borderBottom: 'none' },
                '&:hover .participant-row-chevron': {
                    opacity: 1,
                    transform: 'translateX(4px)',
                },
            }}
        >
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography fontWeight={700} color="primary.main" lineHeight={1.2}>
                            {name}
                        </Typography>
                        <Chip label={status.label} size="small" sx={{ borderRadius: 99, ...status.sx }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                        {company} · {assignment.questionnaire_title ?? assignment.questionnaire_id}
                    </Typography>
                    <Box sx={{ mt: 1.5, maxWidth: 480 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Progression
                            </Typography>
                            <Typography variant="caption" fontWeight={700} color="primary.main">
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
                <Box
                    className="participant-row-chevron"
                    sx={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        opacity: 0.45,
                        transition: 'transform 0.2s ease, opacity 0.2s ease',
                    }}
                >
                    <RowNavigateHint sx={{ opacity: 1, color: 'inherit' }} />
                </Box>
            </Stack>
        </Box>
    );
}

export function ParticipantDashboardRoute() {
    useBreadcrumbs([{ label: 'Tableau de bord' }]);
    const navigate = useNavigate();
    const { data: session, isLoading, isError } = useParticipantSession();

    if (isLoading) {
        return <LoadingCard title="Chargement de votre espace" ariaLabel="Chargement en cours" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre espace participant pour le moment.</Alert>;
    }

    const assignments = session.assignments;
    const total = assignments.length;
    const active = assignments.filter(a => a.campaign_status === 'active').length;
    const toConfirm = assignments.filter(a => a.campaign_status === 'active' && !a.invitation_confirmed).length;
    const completed = assignments.filter(isAssignmentCompleted).length;
    const averageProgress =
        total === 0 ? 0 : Math.round(assignments.reduce((acc, a) => acc + progressForAssignment(a), 0) / total);
    const participantFirstName = session.first_name?.trim() || 'Participant';

    return (
        <Stack spacing={3}>
            <AdminPageHeader
                title={`Bonjour ${participantFirstName}`}
                subtitle="Voici un aperçu rapide de vos parcours et de leur avancement."
                action={{
                    label: 'Voir mes parcours',
                    onClick: () => navigate({ to: '/campaigns' }),
                    icon: ArrowRight,
                }}
            />

            <KpiGrid columns={4}>
                <KpiCard
                    label="Mes parcours"
                    value={total}
                    helper="rattachés à votre compte"
                    icon={ClipboardList}
                />
                <KpiCard label="En cours" value={active} helper="parcours actifs" icon={Target} />
                <KpiCard
                    label="À confirmer"
                    value={toConfirm}
                    helper="participations en attente"
                    icon={Hourglass}
                />
                <KpiCard
                    label="Progression moyenne"
                    value={`${averageProgress}%`}
                    helper={`${completed}/${total || 0} parcours terminés`}
                    icon={CheckCircle2}
                />
            </KpiGrid>

            <ListPanel
                title="Mes parcours"
                subtitle="Vos campagnes en cours et leur progression."
                headerBorder
            >
                {total === 0 ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={Sparkles}
                            title="Aucun parcours pour le moment"
                            description="Les parcours apparaissent ici dès qu'un coach vous y invite."
                        />
                    </Box>
                ) : (
                    assignments.map(a => (
                        <CampaignSummaryRow key={`${a.campaign_id}-${a.questionnaire_id}`} assignment={a} />
                    ))
                )}
            </ListPanel>
        </Stack>
    );
}
