// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { BadgeCheck, CheckCircle2, MessageSquareQuote, Radar, Target, Users } from 'lucide-react';
import * as React from 'react';

import { KpiCard } from '@/components/common/cards';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignCoachProfileLink } from '@/components/participant-dashboard/CampaignWorkspaceHeader';
import { CampaignResultCard } from '@/components/participant-dashboard/CampaignResultCard';
import {
    CampaignStepCard,
    type CampaignStepRouteKind,
    buildCampaignSteps,
} from '@/components/participant-dashboard/CampaignStepCard';
import { CampaignTransparencyCard } from '@/components/participant-dashboard/CampaignTransparencyCard';
import { useConfirmPeerFeedback, useParticipantSession } from '@/hooks/participantSession';
import { useParticipantOwnTransparency } from '@/hooks/transparency';
import type { ParticipantSession } from '@aor/types';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/')({
    component: ParticipantCampaignWorkspaceRoute,
});

type ParticipantAssignment = ParticipantSession['assignments'][number];

const completedValue = (status?: 'locked' | 'pending' | 'completed') => (status === 'completed' ? 1 : 0);

const progressFromAssignment = (assignment: ParticipantAssignment): number => {
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

const campaignStatusLabel = (status?: ParticipantAssignment['campaign_status']): string => {
    if (status === 'active') return 'En cours';
    if (status === 'closed') return 'Terminée';
    if (status === 'archived') return 'Archivée';
    return 'Brouillon';
};

const campaignStatusHelper = (status?: ParticipantAssignment['campaign_status']): string => {
    if (status === 'active') return 'parcours actif';
    if (status === 'closed' || status === 'archived') return 'campagnes clôturées';
    return 'en attente de lancement';
};

function ParticipantCampaignWorkspaceRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const { data: session, isLoading, isError } = useParticipantSession();
    const { data: transparencyEnvelope } = useParticipantOwnTransparency(
        Number.isFinite(campaignId) ? campaignId : null
    );
    const navigate = useNavigate();
    const confirmPeerFeedback = useConfirmPeerFeedback();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const campaignName = assignment?.campaign_name ?? 'Campagne';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName },
    ]);

    const steps = React.useMemo(() => buildCampaignSteps(assignment), [assignment]);
    const peerRatingsCount = assignment?.progression?.peer_ratings_count ?? 0;
    const completedSteps = steps.filter(step => step.state === 'completed').length;
    const progress = assignment ? progressFromAssignment(assignment) : 0;

    const handleConfirmPeerFeedback = React.useCallback(() => {
        if (!Number.isFinite(campaignId)) return;
        confirmPeerFeedback.mutate(campaignId);
    }, [campaignId, confirmPeerFeedback]);

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
            if (routeKind === 'test') {
                const qCode = assignment?.questionnaire_id?.toUpperCase();
                if (!qCode) return;
                navigate({
                    to: '/test/$questionnaireCode',
                    params: { questionnaireCode: qCode },
                });
                return;
            }
            navigate({ to: `/${routeKind}` });
        },
        [navigate, campaignId, assignment]
    );

    if (isLoading) {
        return <LoadingCard title="Chargement de la campagne" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger la campagne pour le moment.</Alert>;
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

    const company = assignment.company_name ?? 'Organisation non renseignée';
    const coachName = assignment.coach_name ?? 'Coach non attribué';
    const questionnaire = assignment.questionnaire_title ?? assignment.questionnaire_id;
    const campaignNotActive = assignment.campaign_status !== 'active';

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                    alignItems: { lg: 'flex-end' },
                    justifyContent: 'space-between',
                    gap: 3,
                }}
            >
                <AdminPageHeader title={campaignName} subtitle={`${company} · ${questionnaire}`} />
                <CampaignCoachProfileLink campaignId={campaignId} coachName={coachName} />
            </Box>

            <KpiGrid columns={4}>
                <KpiCard label="Progression" value={`${progress}%`} helper="du parcours" icon={Target} />
                <KpiCard
                    label="Étapes terminées"
                    value={`${completedSteps}/3`}
                    helper="sur le parcours"
                    icon={CheckCircle2}
                />
                <KpiCard
                    label="Statut"
                    value={campaignStatusLabel(assignment.campaign_status)}
                    helper={campaignStatusHelper(assignment.campaign_status)}
                    icon={BadgeCheck}
                />
                <KpiCard
                    label="Feedbacks pairs"
                    value={peerRatingsCount}
                    helper="saisis"
                    icon={Users}
                />
            </KpiGrid>

            {campaignNotActive && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Cette campagne n'est pas encore active. Vous pourrez commencer les étapes dès qu'elle aura été
                    lancée par votre coach.
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) minmax(0, 1fr)' },
                    gap: 3,
                    alignItems: 'start',
                    width: '100%',
                    minWidth: 0,
                }}
            >
                <ListPanel
                    title="Étapes du parcours"
                    subtitle="Vous avancez dans cet ordre. Les étapes restent verrouillées tant que les prérequis ne sont pas remplis."
                    headerBorder
                >
                    <Stack spacing={1.5} sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
                        {steps.map(step => (
                            <CampaignStepCard
                                key={step.label}
                                step={step}
                                onNavigate={handleNavigate}
                                peerRatingsCount={peerRatingsCount}
                                onConfirmPeerFeedback={handleConfirmPeerFeedback}
                                confirmingPeerFeedback={confirmPeerFeedback.isPending}
                            />
                        ))}
                    </Stack>
                </ListPanel>

                <ListPanel
                    title="Résultats du parcours"
                    subtitle="Consultez vos résultats et retours dès qu'au moins une étape est terminée."
                    headerBorder
                >
                    <Stack spacing={1.5} sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
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
                        <CampaignTransparencyCard
                            snapshot={transparencyEnvelope?.snapshot ?? null}
                            onClick={() =>
                                navigate({
                                    to: '/campaigns/$campaignId/transparency',
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
                </ListPanel>
            </Box>
        </Stack>
    );
}
