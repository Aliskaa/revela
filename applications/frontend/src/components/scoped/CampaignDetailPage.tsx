// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, BadgeCheck, MessageSquareText, Target, Users } from 'lucide-react';

import { CampaignManageParticipants } from '@/components/admin/campaign-detail/CampaignManageParticipants';
import { CampaignParticipantsTable } from '@/components/admin/campaign-detail/CampaignParticipantsTable';
import { CampaignStatusActions } from '@/components/admin/campaign-detail/CampaignStatusActions';
import { CampaignSummaryCard } from '@/components/admin/campaign-detail/CampaignSummaryCard';
import { StatCard } from '@/components/common/cards';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useAdminCampaign, useCoaches, useCompanies } from '@/hooks/admin';
import { computeProgress, statusText } from '@/lib/admin/campaignDetailView';
import { questionnaireLabel } from '@/lib/labels';

export type CampaignDetailScope = 'admin' | 'coach';

export type CampaignDetailPageProps = {
    scope: CampaignDetailScope;
    campaignId: number;
};

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3', 'stat-4'] as const;

const SCOPE_CFG: Record<
    CampaignDetailScope,
    {
        backTo: '/admin/campaigns' | '/coach/campaigns';
        backLabel: string;
        subtitle: string;
        notFound: string;
        matrixUrlPrefix: string;
    }
> = {
    admin: {
        backTo: '/admin/campaigns',
        backLabel: 'Retour aux campagnes',
        subtitle:
            'Cockpit opérationnel de la campagne : questionnaire assigné, participants, invitations, réponses et pilotage.',
        notFound: 'Campagne introuvable.',
        matrixUrlPrefix: '/admin/participants',
    },
    coach: {
        backTo: '/coach/campaigns',
        backLabel: 'Retour à mes campagnes',
        subtitle: 'Cockpit opérationnel : questionnaire assigné, participants, invitations, réponses et pilotage.',
        notFound: 'Campagne introuvable ou hors de votre périmètre.',
        matrixUrlPrefix: '/coach/participants',
    },
};

/**
 * Détail d'une campagne — partagé entre admin et coach. La sécurité repose sur le filtrage
 * backend (`useAdminCampaign` retourne `null` pour une campagne hors périmètre du coach).
 */
export function CampaignDetailPage({ scope, campaignId }: CampaignDetailPageProps) {
    const cfg = SCOPE_CFG[scope];
    const { data: detail, isLoading } = useAdminCampaign(campaignId);
    const { data: companies = [] } = useCompanies();
    const { data: coaches = [] } = useCoaches();

    const campaign = detail?.campaign;
    const participants = detail?.participant_progress ?? [];
    const responsesTotal = detail?.responses_total ?? 0;

    const companyName = campaign ? (companies.find(c => c.id === campaign.companyId)?.name ?? '–') : '–';
    const coachName = campaign ? (coaches.find(c => c.id === campaign.coachId)?.displayName ?? '–') : '–';
    const qLabel = questionnaireLabel(campaign?.questionnaireId);

    const progress = computeProgress(participants);

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: role="status" sur un Stack est volontaire — on n'a pas de progress numérique à exposer via <output>.
            <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" aria-label="Chargement de la campagne">
                <Skeleton variant="rounded" height={140} />
                <KpiGrid columns={4}>
                    {SKELETON_KEYS.map(k => (
                        <Skeleton key={k} variant="rounded" height={110} />
                    ))}
                </KpiGrid>
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
                            {cfg.notFound}
                        </Typography>
                    </CardContent>
                </Card>
                <Button
                    component={Link}
                    to={cfg.backTo}
                    variant="outlined"
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                >
                    {cfg.backLabel}
                </Button>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <PageHeroCard
                eyebrow="Détail campagne"
                title={campaign.name}
                subtitle={cfg.subtitle}
                actions={
                    <Button
                        component={Link}
                        to={cfg.backTo}
                        variant="outlined"
                        startIcon={<ArrowLeft size={16} />}
                        sx={{ borderRadius: 3 }}
                    >
                        {cfg.backLabel}
                    </Button>
                }
            />

            <KpiGrid columns={4}>
                <StatCard label="Participants" value={participants.length} helper="rattachés" icon={Users} />
                <StatCard label="Réponses" value={responsesTotal} helper="collectées" icon={MessageSquareText} />
                <StatCard label="Progression" value={`${progress}%`} helper="parcours global" icon={Target} />
                <StatCard
                    label="Statut"
                    value={statusText(campaign.status)}
                    helper={campaign.status}
                    icon={BadgeCheck}
                />
            </KpiGrid>

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
                        questionnaireLabel={qLabel}
                        progress={progress}
                    />
                    <CampaignParticipantsTable
                        campaignId={campaign.id}
                        participants={participants}
                        matrixUrlPrefix={cfg.matrixUrlPrefix}
                        questionnaireId={campaign.questionnaireId}
                    />
                </Stack>

                <Stack spacing={3}>
                    <CampaignStatusActions campaign={campaign} participantsCount={participants.length} />
                    <CampaignManageParticipants
                        campaign={campaign}
                        alreadyInvitedIds={new Set(participants.map(p => p.participantId))}
                    />
                </Stack>
            </Box>
        </Stack>
    );
}
