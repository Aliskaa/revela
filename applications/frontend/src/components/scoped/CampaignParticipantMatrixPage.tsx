// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { HelpCircle, Radar, Target, UserRound, Users } from 'lucide-react';
import * as React from 'react';

import { KpiCard } from '@/components/common/cards';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { QuestionnaireMatrixDisplay } from '@/components/matrix/QuestionnaireMatrixDisplay';
import { useAdminCampaign, useCoaches, useParticipant, useParticipantQuestionnaireMatrix } from '@/hooks/admin';
import { buildDimensions } from '@/lib/results/buildDimensions';

export type CampaignParticipantMatrixScope = 'admin' | 'coach';

export type CampaignParticipantMatrixPageProps = {
    scope: CampaignParticipantMatrixScope;
    campaignId: number;
    participantId: number;
};

const SCOPE_CFG: Record<
    CampaignParticipantMatrixScope,
    {
        campaignsListTo: '/admin/campaigns' | '/coach/campaigns';
        campaignDetailTo: (campaignId: number) => string;
        notFound: string;
    }
> = {
    admin: {
        campaignsListTo: '/admin/campaigns',
        campaignDetailTo: campaignId => `/admin/campaigns/${campaignId}`,
        notFound: 'Campagne introuvable.',
    },
    coach: {
        campaignsListTo: '/coach/campaigns',
        campaignDetailTo: campaignId => `/coach/campaigns/${campaignId}`,
        notFound: 'Campagne introuvable ou hors de votre périmètre.',
    },
};

const MATRIX_SUBTITLE =
    "Comparaison détaillée entre le Regard sur soi, les retours pairs et l'analyse scientifique, avec écart absolu entre les paires « je suis / je veux ».";

const ELEMENT_HUMAIN_TOOLTIP =
    "Le test scientifique correspond à l'Élément Humain de Will Schutz : un instrument psychométrique qui mesure les besoins relationnels (Inclusion / Contrôle / Ouverture) et l'écart entre les comportements actuels et souhaités.";

/**
 * Vue admin/coach de la matrice des scores d'un participant pour une campagne donnée.
 */
export function CampaignParticipantMatrixPage({
    scope,
    campaignId,
    participantId,
}: CampaignParticipantMatrixPageProps) {
    const cfg = SCOPE_CFG[scope];
    const isAdmin = scope === 'admin';

    const { data: campaignDetail, isLoading: campaignLoading } = useAdminCampaign(campaignId);
    const { data: participantDetail } = useParticipant(participantId);
    const { data: coaches = [] } = useCoaches();

    const qid = campaignDetail?.campaign.questionnaireId ?? '';
    const participantName = participantDetail?.participant.full_name ?? `Participant #${participantId}`;
    const campaignName = campaignDetail?.campaign.name ?? `Campagne #${campaignId}`;
    const coachName = campaignDetail?.campaign
        ? (coaches.find(c => c.id === campaignDetail.campaign.coachId)?.displayName ?? '–')
        : '–';

    const {
        data: matrix,
        isLoading: matrixLoading,
        error,
    } = useParticipantQuestionnaireMatrix(participantId, qid);

    useBreadcrumbs(
        isAdmin
            ? campaignDetail
                ? [
                      { label: 'Administration' },
                      { label: 'Campagnes', to: cfg.campaignsListTo },
                      { label: campaignName, to: cfg.campaignDetailTo(campaignId) },
                      { label: participantName },
                      { label: 'Matrice des scores' },
                  ]
                : [{ label: 'Administration' }, { label: 'Campagnes', to: cfg.campaignsListTo }]
            : campaignDetail
              ? [
                    { label: 'Campagnes', to: cfg.campaignsListTo },
                    { label: campaignName, to: cfg.campaignDetailTo(campaignId) },
                    { label: participantName },
                    { label: 'Matrice des scores' },
                ]
              : [{ label: 'Campagnes', to: cfg.campaignsListTo }]
    );

    const hasResults =
        matrix != null &&
        (matrix.self_response_id != null ||
            matrix.peer_columns.length > 0 ||
            matrix.scientific_response_id != null);

    const dimensions = React.useMemo(() => (matrix ? buildDimensions(matrix) : []), [matrix]);
    const peerCount = matrix?.peer_columns.length ?? 0;
    const activeSourceCount = [
        matrix?.self_response_id != null,
        peerCount > 0,
        matrix?.scientific_response_id != null,
    ].filter(Boolean).length;

    const isLoading = campaignLoading || (qid.length > 0 && matrixLoading);

    if (isLoading) {
        return <LoadingCard title="Chargement de la matrice des scores" />;
    }

    if (!campaignDetail) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {cfg.notFound}
                </Typography>
                <MuiLink component={Link} to={cfg.campaignsListTo} underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    if (qid.length === 0) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ textAlign: 'left' }}>
                    Cette campagne n'a pas de questionnaire associé.
                </Alert>
                <MuiLink
                    component={Link}
                    to={cfg.campaignDetailTo(campaignId)}
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                >
                    Retour à la campagne
                </MuiLink>
            </Stack>
        );
    }

    if (error || !matrix) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Alert severity="error" sx={{ textAlign: 'left' }}>
                    Impossible de charger les données de la matrice pour ce participant.
                </Alert>
                <MuiLink
                    component={Link}
                    to={cfg.campaignDetailTo(campaignId)}
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                >
                    Retour à la campagne
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <PageHeader title="Matrice des scores" subtitle={MATRIX_SUBTITLE} />
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {participantName} · {campaignName} · Coach {coachName}
                    </Typography>
                    <Tooltip title={ELEMENT_HUMAIN_TOOLTIP} arrow>
                        <Box
                            component="span"
                            sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help' }}
                            aria-label="Définition de l'Élément Humain"
                        >
                            <HelpCircle size={14} />
                        </Box>
                    </Tooltip>
                </Stack>
            </Box>

            <KpiGrid columns={4}>
                <KpiCard label="Feedbacks pairs" value={peerCount} helper="reçus" icon={Users} />
                <KpiCard label="Dimensions" value={dimensions.length} helper="analysées" icon={Radar} />
                <KpiCard label="Sources" value={activeSourceCount} helper="comparées" icon={Target} />
                <KpiCard label="Coach" value="Référent" helper={coachName} icon={UserRound} />
            </KpiGrid>

            <ListPanel
                title="Matrice comparée"
                subtitle="Regard sur soi, retours pairs et test scientifique côte à côte."
                headerBorder
            >
                {!hasResults ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={Radar}
                            variant="secondary"
                            title="Scores indisponibles"
                            description="Le participant n'a pas encore complété les étapes nécessaires pour afficher la matrice."
                        />
                    </Box>
                ) : (
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, overflow: 'visible' }}>
                        <QuestionnaireMatrixDisplay matrix={matrix} />
                    </Box>
                )}
            </ListPanel>
        </Stack>
    );
}
