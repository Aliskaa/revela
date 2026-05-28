// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Link as MuiLink, Skeleton, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { BadgeCheck, MessageSquareText, Target, Users } from 'lucide-react';

import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';

import { CampaignManageParticipants } from '@/components/admin/campaign-detail/CampaignManageParticipants';
import { CampaignParticipantsTable } from '@/components/admin/campaign-detail/CampaignParticipantsTable';
import { CampaignStatusActions } from '@/components/admin/campaign-detail/CampaignStatusActions';
import { CampaignSummaryCard } from '@/components/admin/campaign-detail/CampaignSummaryCard';
import { CampaignSynthesisCard } from '@/components/admin/campaign-detail/CampaignSynthesisCard';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { useAdminCampaign, useCoaches, useCompanies } from '@/hooks/admin';
import { computeProgress, statusText } from '@/lib/admin/campaignDetailView';
import { questionnaireLabel } from '@/lib/labels';
import type { CampaignStatus } from '@aor/types';

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3', 'stat-4'] as const;

const SUBTITLE =
    'Cockpit opérationnel de la campagne : questionnaire assigné, participants, invitations, réponses et pilotage.';

function statusHelper(status: CampaignStatus): string {
    if (status === 'active') {
        return 'en cours';
    }
    if (status === 'closed' || status === 'archived') {
        return 'archivée';
    }
    return 'brouillon';
}

export type AdminCampaignDetailPageProps = {
    campaignId: number;
};

export function AdminCampaignDetailPage({ campaignId }: AdminCampaignDetailPageProps) {
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

    useBreadcrumbs(
        campaign
            ? [
                  { label: 'Campagnes', to: '/admin/campaigns' },
                  { label: campaign.name },
              ]
            : [{ label: 'Campagnes', to: '/admin/campaigns' }]
    );

    if (isLoading) {
        return (
            <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" aria-label="Chargement de la campagne">
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="text" width="60%" height={48} />
                <KpiGrid columns={4}>
                    {SKELETON_KEYS.map(k => (
                        <Skeleton key={k} variant="rounded" height={140} />
                    ))}
                </KpiGrid>
                <Skeleton variant="rounded" height={400} />
            </Stack>
        );
    }

    if (!campaign) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Campagne introuvable.
                </Typography>
                <MuiLink component={Link} to="/admin/campaigns" underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    {campaign.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {SUBTITLE}
                </Typography>
            </Box>

            <KpiGrid columns={4}>
                <KpiCard label="Participants" value={participants.length} helper="rattachés" icon={Users} />
                <KpiCard
                    label="Réponses"
                    value={responsesTotal}
                    helper="collectées"
                    icon={MessageSquareText}
                />
                <KpiCard label="Progression" value={`${progress}%`} helper="parcours global" icon={Target} />
                <KpiCard
                    label="Statut"
                    value={statusText(campaign.status)}
                    helper={statusHelper(campaign.status)}
                    icon={BadgeCheck}
                />
            </KpiGrid>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        xl: 'minmax(0, 2fr) minmax(0, 1fr)',
                    },
                    gap: 3,
                    alignItems: 'start',
                    width: '100%',
                    minWidth: 0,
                }}
            >
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <CampaignSummaryCard
                        harmonized
                        campaign={campaign}
                        companyName={companyName}
                        coachName={coachName}
                        questionnaireLabel={qLabel}
                        progress={progress}
                    />
                    <CampaignParticipantsTable
                        campaignId={campaign.id}
                        participants={participants}
                        participantUrlPrefix="/admin/participants"
                        matrixUrlPrefix="/admin/campaigns"
                        transparencyUrlPrefix="/admin/campaigns"
                    />
                </Stack>

                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <CampaignSynthesisCard harmonized campaignId={campaign.id} scope="admin" />
                    <CampaignStatusActions
                        harmonized
                        campaign={campaign}
                        participantsCount={participants.length}
                    />
                    <CampaignManageParticipants
                        harmonized
                        campaign={campaign}
                        alreadyInvitedIds={new Set(participants.map(p => p.participantId))}
                    />
                </Stack>
            </Box>
        </Stack>
    );
}
