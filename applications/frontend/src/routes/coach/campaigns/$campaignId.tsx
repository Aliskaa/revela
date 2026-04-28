// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, BadgeCheck, MessageSquareText, Target, Users } from 'lucide-react';

import { CampaignManageParticipants } from '@/components/admin/campaign-detail/CampaignManageParticipants';
import { CampaignParticipantsTable } from '@/components/admin/campaign-detail/CampaignParticipantsTable';
import { CampaignPilotage } from '@/components/admin/campaign-detail/CampaignPilotage';
import { CampaignStatusActions } from '@/components/admin/campaign-detail/CampaignStatusActions';
import { CampaignSummaryCard } from '@/components/admin/campaign-detail/CampaignSummaryCard';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaign, useCoaches, useCompanies } from '@/hooks/admin';
import { QUESTIONNAIRE_LABELS, computeProgress, statusText } from '@/lib/admin/campaignDetailView';

export const Route = createFileRoute('/coach/campaigns/$campaignId')({
    component: CoachCampaignDetailRoute,
});

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3', 'stat-4'] as const;

/**
 * Détail d'une campagne côté coach. Réutilise les mêmes composants que la page admin
 * (`CampaignSummaryCard`, `CampaignParticipantsTable`, etc.) — la sécurité repose sur
 * le filtrage backend `useAdminCampaign` qui retourne `null` pour une campagne hors
 * périmètre du coach connecté (cf. avancement-2026-04-28.md §1.b).
 */
function CoachCampaignDetailRoute() {
    const { campaignId } = Route.useParams();
    const numericId = Number(campaignId);

    const { data: detail, isLoading } = useAdminCampaign(numericId);
    const { data: companies = [] } = useCompanies();
    const { data: coaches = [] } = useCoaches();

    const campaign = detail?.campaign;
    const participants = detail?.participant_progress ?? [];
    const responsesTotal = detail?.responses_total ?? 0;

    const companyName = campaign ? (companies.find(c => c.id === campaign.companyId)?.name ?? '–') : '–';
    const coachName = campaign ? (coaches.find(c => c.id === campaign.coachId)?.displayName ?? '–') : '–';
    const questionnaireLabel = campaign?.questionnaireId
        ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ?? campaign.questionnaireId)
        : '–';

    const progress = computeProgress(participants);

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: role="status" sur un Stack est volontaire — on n'a pas de progress numérique à exposer via <output>.
            <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" aria-label="Chargement de la campagne">
                <Skeleton variant="rounded" height={140} />
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                        gap: 2,
                    }}
                >
                    {SKELETON_KEYS.map(k => (
                        <Skeleton key={k} variant="rounded" height={110} />
                    ))}
                </Box>
                <Skeleton variant="rounded" height={300} />
            </Stack>
        );
    }

    if (!campaign) {
        return (
            <Stack spacing={2}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Campagne introuvable ou hors de votre périmètre.
                        </Typography>
                    </CardContent>
                </Card>
                <Button
                    component={Link}
                    to="/coach/campaigns"
                    variant="outlined"
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                >
                    Retour à mes campagnes
                </Button>
            </Stack>
        );
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
                                label="Détail campagne"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {campaign.name}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 900 }}
                            >
                                Cockpit opérationnel : questionnaire assigné, participants, invitations, réponses et
                                pilotage.
                            </Typography>
                        </Box>

                        <Button
                            component={Link}
                            to="/coach/campaigns"
                            variant="outlined"
                            startIcon={<ArrowLeft size={16} />}
                            sx={{ borderRadius: 3 }}
                        >
                            Retour à mes campagnes
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard label="Participants" value={participants.length} helper="rattachés" icon={Users} />
                <StatCard label="Réponses" value={responsesTotal} helper="collectées" icon={MessageSquareText} />
                <StatCard label="Progression" value={`${progress}%`} helper="parcours global" icon={Target} />
                <StatCard
                    label="Statut"
                    value={statusText(campaign.status)}
                    helper={campaign.status}
                    icon={BadgeCheck}
                />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1.25fr 0.75fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <Stack spacing={3}>
                    <CampaignSummaryCard
                        campaign={campaign}
                        companyName={companyName}
                        coachName={coachName}
                        questionnaireLabel={questionnaireLabel}
                        progress={progress}
                    />
                    <CampaignParticipantsTable
                        campaignId={campaign.id}
                        participants={participants}
                        matrixUrlPrefix="/coach/participants"
                        questionnaireId={campaign.questionnaireId}
                    />
                </Stack>

                <Stack spacing={3}>
                    <CampaignStatusActions campaign={campaign} />
                    <CampaignManageParticipants campaign={campaign} />
                    <CampaignPilotage
                        questionnaireLabel={questionnaireLabel}
                        coachName={coachName}
                        companyName={companyName}
                    />
                </Stack>
            </Box>
        </Stack>
    );
}
