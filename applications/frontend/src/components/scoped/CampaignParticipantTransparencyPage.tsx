// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Link as MuiLink,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ScanEye } from 'lucide-react';

import { CampaignParticipantTransparencyMatrix } from '@/components/admin/campaign-detail/CampaignParticipantTransparencyMatrix';
import { Button } from '@/components/common/Button';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCampaign, useParticipant, useParticipantQuestionnaireMatrix } from '@/hooks/admin';
import {
    useActivateCampaignParticipantTransparency,
    useAdminCampaignParticipantTransparency,
} from '@/hooks/transparency';

export type CampaignParticipantTransparencyScope = 'admin' | 'coach';

export type CampaignParticipantTransparencyPageProps = {
    scope: CampaignParticipantTransparencyScope;
    campaignId: number;
    participantId: number;
};

const SCOPE_CFG: Record<
    CampaignParticipantTransparencyScope,
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

/**
 * Vue admin/coach de la matrice de transparence d'un participant pour une campagne donnée.
 */
export function CampaignParticipantTransparencyPage({
    scope,
    campaignId,
    participantId,
}: CampaignParticipantTransparencyPageProps) {
    const cfg = SCOPE_CFG[scope];
    const isAdmin = scope === 'admin';

    const { data: campaignDetail, isLoading: campaignLoading } = useAdminCampaign(campaignId);
    const { data: participantDetail } = useParticipant(participantId);
    const qid = campaignDetail?.campaign.questionnaireId ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantQuestionnaireMatrix(participantId, qid);
    const { data: envelope, isLoading: envelopeLoading } = useAdminCampaignParticipantTransparency(
        campaignId,
        participantId
    );
    const activate = useActivateCampaignParticipantTransparency();

    const participantName = participantDetail?.participant.full_name ?? `Participant #${participantId}`;
    const campaignName = campaignDetail?.campaign.name ?? `Campagne #${campaignId}`;
    const snapshot = envelope?.snapshot ?? null;
    const hasSnapshot = snapshot !== null;
    const peerCount = matrix?.peer_columns.length ?? snapshot?.peer_count ?? 0;

    useBreadcrumbs(
        isAdmin
            ? campaignDetail
                ? [
                      { label: 'Administration' },
                      { label: 'Campagnes', to: cfg.campaignsListTo },
                      { label: campaignName, to: cfg.campaignDetailTo(campaignId) },
                      { label: participantName },
                      { label: 'Repère de transparence' },
                  ]
                : [{ label: 'Administration' }, { label: 'Campagnes', to: cfg.campaignsListTo }]
            : campaignDetail
              ? [
                    { label: 'Campagnes', to: cfg.campaignsListTo },
                    { label: campaignName, to: cfg.campaignDetailTo(campaignId) },
                    { label: participantName },
                    { label: 'Repère de transparence' },
                ]
              : [{ label: 'Campagnes', to: cfg.campaignsListTo }]
    );

    const isLoading = campaignLoading || envelopeLoading || (qid.length > 0 && matrixLoading);

    if (isLoading) {
        return (
            <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" aria-label="Chargement du repère">
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="text" width="60%" height={48} />
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={420} />
            </Stack>
        );
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

    if (!matrix) {
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

    const activateLabel = hasSnapshot
        ? `Recalculer le repère (${String(snapshot.value)} %)`
        : 'Lancer le calcul du repère';
    const activateTooltip = hasSnapshot
        ? `Activé le ${new Date(snapshot.activated_at).toLocaleDateString()} — basé sur ${String(
              snapshot.peer_count
          )} feedback(s) pair(s). Cliquez pour recalculer.`
        : 'Calcule le score de transparence à partir des feedbacks reçus et le partage avec le participant.';

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
                    Repère de transparence
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {participantName} — {campaignName}. Détail du calcul (F, retours pairs, écarts, conversions F → P)
                    et activation du score partagé avec le participant.
                </Typography>
            </Box>

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
                                    {hasSnapshot
                                        ? `Activé — ${snapshot.peer_count} feedback${snapshot.peer_count > 1 ? 's' : ''} pair${snapshot.peer_count > 1 ? 's' : ''} pris en compte.`
                                        : 'Le score n’a pas encore été activé pour ce participant.'}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                            {hasSnapshot ? (
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
                            ) : null}
                            <Tooltip title={activateTooltip}>
                                <span>
                                    <Button
                                        appearance={hasSnapshot ? 'secondary' : 'primary'}
                                        startIcon={
                                            activate.isPending ? (
                                                <CircularProgress size={14} color="inherit" />
                                            ) : (
                                                <ScanEye size={16} />
                                            )
                                        }
                                        onClick={() => activate.mutate({ campaignId, participantId })}
                                        disabled={activate.isPending}
                                    >
                                        {activateLabel}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <CampaignParticipantTransparencyMatrix matrix={matrix} peerCount={peerCount} snapshot={snapshot} />
        </Stack>
    );
}
