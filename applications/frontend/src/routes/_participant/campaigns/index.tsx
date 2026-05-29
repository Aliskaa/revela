// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { BadgeCheck, CheckCircle2, ClipboardList, Lock, Target, Users } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/common/Button';
import { KpiCard } from '@/components/common/cards';
import { RowNavigateHint } from '@/components/common/data-table';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchField } from '@/components/common/forms/SearchField';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { listRowSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useConfirmCampaignParticipation, useParticipantSession } from '@/hooks/participantSession';
import { useCampaignStore } from '@/stores/campaignStore';
import type { ParticipantSession } from '@aor/types';

export const Route = createFileRoute('/_participant/campaigns/')({
    component: ParticipantCampaignsRoute,
});

type CampaignStatus = 'active' | 'draft' | 'closed' | 'archived';
type ParticipantAssignment = ParticipantSession['assignments'][number];

type Campaign = {
    id: string;
    campaignId: number | null;
    questionnaireId: string;
    name: string;
    company: string;
    coach: string;
    questionnaire: string;
    status: CampaignStatus;
    progress: number;
    nextAction: string;
    invitationConfirmed: boolean;
};

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

const nextActionFromAssignment = (assignment: ParticipantAssignment): string => {
    if (!assignment.invitation_confirmed) {
        return 'Confirmer votre participation';
    }
    const progression = assignment.progression;
    if (!progression) {
        return assignment.allow_test_without_manual_inputs
            ? 'Passer le test Élément Humain'
            : 'Démarrer le parcours';
    }
    if (progression.self_rating_status !== 'completed') {
        return 'Compléter le regard sur soi';
    }
    if (progression.peer_feedback_status !== 'completed') {
        return 'Finaliser le feedback des pairs';
    }
    if (progression.element_humain_status !== 'completed') {
        return 'Passer le test Élément Humain';
    }
    if (progression.feedback_coach == null) {
        return 'Consulter les résultats';
    }
    return 'Consulter les retours du coach';
};

const campaignFromAssignment = (assignment: ParticipantAssignment): Campaign => ({
    id: `${assignment.campaign_id ?? 'none'}-${assignment.questionnaire_id}`,
    campaignId: assignment.campaign_id,
    questionnaireId: assignment.questionnaire_id,
    name: assignment.campaign_name ?? 'Campagne sans nom',
    company: assignment.company_name ?? 'Organisation non renseignée',
    coach: assignment.coach_name ?? 'Coach non attribué',
    questionnaire: assignment.questionnaire_title ?? assignment.questionnaire_id,
    status: assignment.campaign_status ?? 'draft',
    progress: progressFromAssignment(assignment),
    nextAction: nextActionFromAssignment(assignment),
    invitationConfirmed: assignment.invitation_confirmed,
});

const statusChip = (campaign: Campaign) => {
    if (!campaign.invitationConfirmed && campaign.status === 'active') {
        return {
            label: 'Participation à confirmer',
            sx: { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' },
        };
    }
    if (campaign.status === 'active') {
        return { label: 'En cours', sx: { bgcolor: 'tint.successBg', color: 'tint.successText' } };
    }
    if (campaign.status === 'closed') {
        return { label: 'Terminée', sx: { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' } };
    }
    return { label: 'Brouillon', sx: { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' } };
};

function CampaignListRow({ campaign }: { campaign: Campaign }) {
    const selectCampaign = useCampaignStore(s => s.select);
    const confirmParticipation = useConfirmCampaignParticipation();
    const status = statusChip(campaign);
    const needsConfirmation = campaign.status === 'active' && !campaign.invitationConfirmed;
    const detailTo = campaign.campaignId != null ? `/campaigns/${campaign.campaignId}` : undefined;

    const handleOpen = () => {
        if (campaign.campaignId == null) return;
        selectCampaign(campaign.campaignId);
    };

    const handleConfirm = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (campaign.campaignId == null) return;
        confirmParticipation.mutate(campaign.campaignId);
    };

    const rowContent = (
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={700} color="primary.main" lineHeight={1.2}>
                        {campaign.name}
                    </Typography>
                    <Chip label={status.label} size="small" sx={{ borderRadius: 99, ...status.sx }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                    {campaign.company} · Coach {campaign.coach} · {campaign.questionnaire}
                </Typography>
                <Box sx={{ mt: 1.5, maxWidth: 520 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Progression
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                            {campaign.progress}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={campaign.progress}
                        sx={{
                            height: 8,
                            borderRadius: 99,
                            bgcolor: 'tint.subtleBg',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        {campaign.nextAction}
                    </Typography>
                </Box>
            </Box>
            {needsConfirmation ? (
                <Button
                    appearance="primary"
                    startIcon={<BadgeCheck size={16} />}
                    onClick={handleConfirm}
                    disabled={confirmParticipation.isPending || campaign.campaignId == null}
                    sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                    {confirmParticipation.isPending ? 'Confirmation…' : 'Confirmer'}
                </Button>
            ) : (
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
            )}
        </Stack>
    );

    const rowSx = {
        display: 'block',
        px: { xs: 2.5, md: 4 },
        py: 3,
        borderBottom: '1px solid',
        borderColor: 'surface.lavenderGrey',
        textDecoration: 'none',
        color: 'inherit',
        ...listRowSx,
        '&:last-child': { borderBottom: 'none' },
        '&:hover .participant-row-chevron': {
            opacity: 1,
            transform: 'translateX(4px)',
        },
    };

    if (needsConfirmation || !detailTo) {
        return <Box sx={rowSx}>{rowContent}</Box>;
    }

    return (
        <Box
            component={Link}
            to={detailTo}
            aria-label={`Ouvrir ${campaign.name}`}
            onClick={handleOpen}
            sx={{ ...rowSx, cursor: 'pointer' }}
        >
            {rowContent}
        </Box>
    );
}

function EmptyCampaignsState({ query }: { query: string }) {
    if (query.trim()) {
        return (
            <EmptyState
                icon={ClipboardList}
                variant="secondary"
                title="Aucun résultat"
                description="Aucune campagne ne correspond à votre recherche."
            />
        );
    }

    return (
        <EmptyState
            icon={Lock}
            variant="secondary"
            title="Aucune campagne disponible pour le moment"
            description="Les campagnes apparaissent ici dès qu'un coach vous y invite."
        />
    );
}

function ParticipantCampaignsRoute() {
    useBreadcrumbs([{ label: 'Mes campagnes' }]);
    const [query, setQuery] = React.useState('');
    const { data: session, isLoading, isError } = useParticipantSession();

    const assignments = session?.assignments ?? [];
    const sourceCampaigns = assignments.map(campaignFromAssignment);
    const normalizedQuery = query.trim().toLowerCase();
    const visibleCampaigns = sourceCampaigns.filter(campaign => {
        if (!normalizedQuery) {
            return true;
        }
        return [campaign.name, campaign.company, campaign.coach, campaign.questionnaire]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
    });

    const activeCount = assignments.filter(a => a.campaign_status === 'active').length;
    const completedQuestionnaires = assignments.filter(
        a => a.progression?.element_humain_status === 'completed'
    ).length;
    const completedFeedbacks = assignments.filter(
        a => a.progression?.peer_feedback_status === 'completed'
    ).length;

    if (isLoading) {
        return (
            <LoadingCard
                title="Chargement de vos campagnes"
                description="Récupération des campagnes rattachées à votre espace participant."
            />
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger vos campagnes pour le moment.</Alert>;
    }

    return (
        <Stack spacing={3}>
            <AdminPageHeader
                title="Mes campagnes"
                subtitle="Toutes les campagnes auxquelles vous êtes rattaché. Une campagne correspond à un questionnaire unique."
            />

            <KpiGrid columns={4}>
                <KpiCard
                    label="Mes parcours"
                    value={assignments.length}
                    helper="rattachés à votre compte"
                    icon={ClipboardList}
                />
                <KpiCard label="En cours" value={activeCount} helper="parcours actifs" icon={Target} />
                <KpiCard
                    label="Questionnaires complétés"
                    value={completedQuestionnaires}
                    helper="tests terminés"
                    icon={CheckCircle2}
                />
                <KpiCard
                    label="Feedbacks reçus"
                    value={completedFeedbacks}
                    helper="feedback des pairs"
                    icon={Users}
                />
            </KpiGrid>

            <ListPanel
                title="Liste des parcours"
                subtitle="Cliquez sur une ligne pour ouvrir le parcours."
                headerBorder
                headerActions={
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Rechercher une campagne, un coach, une organisation…"
                    />
                }
            >
                {visibleCampaigns.length === 0 ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyCampaignsState query={query} />
                    </Box>
                ) : (
                    visibleCampaigns.map(campaign => <CampaignListRow key={campaign.id} campaign={campaign} />)
                )}
            </ListPanel>
        </Stack>
    );
}
