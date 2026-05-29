// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ScanEye } from 'lucide-react';
import * as React from 'react';

import { CampaignParticipantTransparencyMatrix } from '@/components/admin/campaign-detail/CampaignParticipantTransparencyMatrix';
import { EmptyState } from '@/components/common/EmptyState';
import { AdminPageHeader, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useParticipantOwnTransparency } from '@/hooks/transparency';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/transparency')({
    component: ParticipantTransparencyRoute,
});

const TRANSPARENCY_SUBTITLE =
    'Détail du calcul (F, retours pairs, écarts, conversions F → P) partagé par votre coach une fois le repère activé.';

function ParticipantTransparencyRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);

    const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
    const { data: envelope, isLoading: envelopeLoading } = useParticipantOwnTransparency(
        Number.isFinite(campaignId) ? campaignId : null
    );

    const assignment = React.useMemo(
        () => session?.assignments.find(a => a.campaign_id === campaignId),
        [session, campaignId]
    );

    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Repère de transparence' },
    ]);

    const qid = assignment?.questionnaire_id ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        Number.isFinite(campaignId) ? campaignId : undefined,
        'received'
    );

    const snapshot = envelope?.snapshot ?? null;
    const hasSnapshot = snapshot !== null;
    const peerCount = matrix?.peer_columns.length ?? snapshot?.peer_count ?? 0;

    const isLoading = sessionLoading || envelopeLoading || (qid.length > 0 && matrixLoading);

    if (isLoading) {
        return <LoadingCard title="Chargement du repère de transparence" />;
    }

    if (sessionError || !session) {
        return <Alert severity="error">Impossible de charger votre repère de transparence pour le moment.</Alert>;
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

    if (qid.length === 0) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Alert severity="warning" sx={{ textAlign: 'left' }}>
                    Cette campagne n'a pas de questionnaire associé.
                </Alert>
                <MuiLink component={Link} to={campaignPath} underline="hover" sx={{ fontWeight: 600 }}>
                    Retour à la campagne
                </MuiLink>
            </Stack>
        );
    }

    if (hasSnapshot && !matrix) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Alert severity="error" sx={{ textAlign: 'left' }}>
                    Impossible de charger les données de calcul pour le moment.
                </Alert>
                <MuiLink component={Link} to={campaignPath} underline="hover" sx={{ fontWeight: 600 }}>
                    Retour à la campagne
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <AdminPageHeader title="Repère de transparence" subtitle={TRANSPARENCY_SUBTITLE} />
            </Box>

            {!hasSnapshot ? (
                <ListPanel
                    title="Score de transparence"
                    subtitle="Votre coach active le repère une fois les feedbacks pairs suffisants."
                    headerBorder
                >
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={ScanEye}
                            variant="secondary"
                            title="Repère non activé"
                            description="Le repère de transparence n'a pas encore été activé par votre coach. Vous pourrez consulter le détail une fois le calcul lancé."
                        />
                    </Box>
                </ListPanel>
            ) : (
                <>
                    <Card variant="outlined" sx={surfaceCardSx}>
                        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={2}
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                justifyContent="space-between"
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2,
                                            display: 'grid',
                                            placeItems: 'center',
                                            bgcolor: 'tint.primaryBg',
                                            color: 'primary.main',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <ScanEye size={22} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} color="primary.main">
                                            Score de transparence
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Activé — {snapshot.peer_count} feedback
                                            {snapshot.peer_count > 1 ? 's' : ''} pair
                                            {snapshot.peer_count > 1 ? 's' : ''} pris en compte.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                    <Typography
                                        sx={{
                                            fontSize: { xs: 40, md: 56 },
                                            fontWeight: 900,
                                            lineHeight: 1,
                                            color: 'primary.main',
                                            letterSpacing: -0.04,
                                        }}
                                    >
                                        {snapshot.value}
                                        <Box component="span" sx={{ fontSize: '0.45em', fontWeight: 700, ml: 0.5 }}>
                                            %
                                        </Box>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Activé le {new Date(snapshot.activated_at).toLocaleDateString()}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {matrix ? (
                        <CampaignParticipantTransparencyMatrix
                            matrix={matrix}
                            peerCount={peerCount}
                            snapshot={snapshot}
                            showPeerAvatars={false}
                        />
                    ) : null}
                </>
            )}
        </Stack>
    );
}
