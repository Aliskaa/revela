// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ScanEye } from 'lucide-react';
import * as React from 'react';

import { LoadingCard } from '@/components/common/LoadingCard';
import { useAdminCampaign, useParticipant, useParticipantQuestionnaireMatrix } from '@/hooks/admin';
import {
    useActivateCampaignParticipantTransparency,
    useAdminCampaignParticipantTransparency,
} from '@/hooks/transparency';
import { TRANSPARENCY_F_TO_P_TABLE, transparencyConvertFToP } from '@aor/types';

export type CampaignParticipantTransparencyScope = 'admin' | 'coach';

export type CampaignParticipantTransparencyPageProps = {
    scope: CampaignParticipantTransparencyScope;
    campaignId: number;
    participantId: number;
};

type RowComputation = {
    score_key: number;
    label: string;
    scientific: number | null;
    peers: ReadonlyArray<number | null>;
    ecarts: ReadonlyArray<number | null>;
    p: number | null;
};

const SCOPE_CFG: Record<
    CampaignParticipantTransparencyScope,
    {
        backTo: '/admin/campaigns/$campaignId' | '/coach/campaigns/$campaignId';
        backLabel: string;
        notFound: string;
    }
> = {
    admin: {
        backTo: '/admin/campaigns/$campaignId',
        backLabel: 'Retour à la campagne',
        notFound: 'Campagne introuvable.',
    },
    coach: {
        backTo: '/coach/campaigns/$campaignId',
        backLabel: 'Retour à la campagne',
        notFound: 'Campagne introuvable ou hors de votre périmètre.',
    },
};

/**
 * Vue admin/coach de la matrice de transparence d'un participant pour une campagne donnée.
 *
 * Affiche le détail du calcul (F, retours pairs, écarts, conversions F→P) et permet à l'admin
 * ou au coach de lancer (ou recalculer) le score de transparence partagé avec le participant.
 * La sécurité repose sur le filtrage backend des endpoints `/admin/...` selon le rôle JWT.
 */
export function CampaignParticipantTransparencyPage({
    scope,
    campaignId,
    participantId,
}: CampaignParticipantTransparencyPageProps) {
    const cfg = SCOPE_CFG[scope];

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

    const peerCount = matrix?.peer_columns.length ?? 0;
    const snapshot = envelope?.snapshot ?? null;

    const rows = React.useMemo<RowComputation[]>(() => {
        if (!matrix) return [];
        return matrix.rows.map(r => {
            const ecarts: (number | null)[] = r.peers.map(peer => {
                if (peer === null || r.scientific === null) return null;
                return Math.abs(peer - r.scientific);
            });
            const p = r.scientific === null ? null : transparencyConvertFToP(r.scientific);
            return {
                score_key: r.score_key,
                label: r.label,
                scientific: r.scientific,
                peers: r.peers,
                ecarts,
                p,
            };
        });
    }, [matrix]);

    const totals = React.useMemo(() => {
        let sumEcart = 0;
        let sumP = 0;
        for (const row of rows) {
            for (const e of row.ecarts) {
                if (e !== null) sumEcart += e;
            }
            if (row.p !== null) sumP += row.p;
        }
        return { sumEcart, sumP };
    }, [rows]);

    const backButton = (
        <Link to={cfg.backTo} params={{ campaignId: String(campaignId) }}>
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} sx={{ alignSelf: 'flex-start' }}>
                {cfg.backLabel}
            </Button>
        </Link>
    );

    const isLoading = campaignLoading || envelopeLoading || (qid.length > 0 && matrixLoading);

    if (isLoading) {
        return <LoadingCard title="Chargement du repère de transparence" />;
    }

    if (!campaignDetail) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">{cfg.notFound}</Alert>
                {backButton}
            </Stack>
        );
    }

    if (qid.length === 0) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">Cette campagne n'a pas de questionnaire associé.</Alert>
                {backButton}
            </Stack>
        );
    }

    if (!matrix) {
        return (
            <Stack spacing={2}>
                <Alert severity="error">Impossible de charger les données de la matrice pour ce participant.</Alert>
                {backButton}
            </Stack>
        );
    }

    const hasSnapshot = snapshot !== null;
    const activateLabel = hasSnapshot
        ? `Recalculer le repère (${String(snapshot.value)} %)`
        : 'Lancer le calcul du repère';
    const activateTooltip = hasSnapshot
        ? `Activé le ${new Date(snapshot.activated_at).toLocaleDateString()} — basé sur ${String(
              snapshot.peer_count
          )} feedback(s) pair(s). Cliquez pour recalculer.`
        : 'Calcule le score de transparence à partir des feedbacks reçus et le partage avec le participant.';

    return (
        <Stack spacing={3}>
            {backButton}

            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                    >
                        <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 4,
                                        display: 'grid',
                                        placeItems: 'center',
                                        bgcolor: 'tint.primaryBg',
                                        color: 'primary.main',
                                    }}
                                >
                                    <ScanEye size={20} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.4 }}>
                                        Repère de transparence
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {participantName} — {campaignName}
                                    </Typography>
                                    {hasSnapshot ? (
                                        <Typography variant="caption" color="text.secondary">
                                            Suite à {snapshot.peer_count}{' '}
                                            {snapshot.peer_count > 1 ? 'feedbacks pairs' : 'feedback pair'} reçus.
                                        </Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            Le score n'a pas encore été activé.
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                        </Box>
                        <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                            {hasSnapshot ? (
                                <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                                    <Typography
                                        sx={{
                                            fontSize: { xs: 48, md: 64 },
                                            fontWeight: 800,
                                            lineHeight: 1,
                                            color: 'primary.main',
                                            letterSpacing: -2,
                                        }}
                                    >
                                        {snapshot.value}
                                        <Box component="span" sx={{ fontSize: '0.5em', fontWeight: 700, ml: 0.5 }}>
                                            %
                                        </Box>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Score de transparence
                                    </Typography>
                                </Stack>
                            ) : null}
                            <Tooltip title={activateTooltip}>
                                <span>
                                    <Button
                                        variant={hasSnapshot ? 'outlined' : 'contained'}
                                        color="primary"
                                        startIcon={
                                            activate.isPending ? (
                                                <CircularProgress size={14} color="inherit" />
                                            ) : (
                                                <ScanEye size={16} />
                                            )
                                        }
                                        onClick={() => activate.mutate({ campaignId, participantId })}
                                        disabled={activate.isPending}
                                        sx={{ borderRadius: 99 }}
                                    >
                                        {activateLabel}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
                        <Box sx={{ overflowX: 'auto', flex: 1 }}>
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Dimension</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'tint.mutedBg' }}>
                                            F
                                        </TableCell>
                                        {(matrix?.peer_columns ?? []).map((col, i) => (
                                            <TableCell
                                                key={`peer-${col.response_id}`}
                                                align="center"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                {col.label.length > 0 ? col.label : `Pair #${i + 1}`}
                                            </TableCell>
                                        ))}
                                        {(matrix?.peer_columns ?? []).map((col, i) => (
                                            <TableCell
                                                key={`ecart-${col.response_id}`}
                                                align="center"
                                                sx={{ fontWeight: 700, bgcolor: 'tint.warningBg' }}
                                            >
                                                Écart {col.label.length > 0 ? col.label : `#${i + 1}`}
                                            </TableCell>
                                        ))}
                                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'tint.primaryBg' }}>
                                            P
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map(row => (
                                        <TableRow key={row.score_key}>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                                            <TableCell align="center" sx={{ bgcolor: 'tint.mutedBg' }}>
                                                {row.scientific ?? '—'}
                                            </TableCell>
                                            {row.peers.map((peer, i) => (
                                                <TableCell
                                                    key={`p-${row.score_key}-${
                                                        matrix?.peer_columns[i]?.response_id ?? i
                                                    }`}
                                                    align="center"
                                                >
                                                    {peer ?? '—'}
                                                </TableCell>
                                            ))}
                                            {row.ecarts.map((ecart, i) => (
                                                <TableCell
                                                    key={`e-${row.score_key}-${
                                                        matrix?.peer_columns[i]?.response_id ?? i
                                                    }`}
                                                    align="center"
                                                    sx={{ bgcolor: 'tint.warningBg' }}
                                                >
                                                    {ecart ?? '—'}
                                                </TableCell>
                                            ))}
                                            <TableCell
                                                align="center"
                                                sx={{ bgcolor: 'tint.primaryBg', fontWeight: 700 }}
                                            >
                                                {row.p ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ '& td': { borderTop: '2px solid', borderTopColor: 'border' } }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: 'tint.mutedBg' }} />
                                        {(matrix?.peer_columns ?? []).map(col => (
                                            <TableCell key={`p-total-${col.response_id}`} align="center" />
                                        ))}
                                        <TableCell
                                            align="center"
                                            colSpan={Math.max(peerCount, 1)}
                                            sx={{ bgcolor: 'tint.warningBg', fontWeight: 800 }}
                                        >
                                            Σ écart = {totals.sumEcart}
                                        </TableCell>
                                        <TableCell align="center" sx={{ bgcolor: 'tint.primaryBg', fontWeight: 800 }}>
                                            Σ P = {totals.sumP}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>

                        <Divider orientation="vertical" flexItem />

                        <Box
                            sx={{
                                display: 'inline-block',
                                border: '1px solid',
                                borderColor: 'border',
                                borderRadius: 2,
                                mb: 2,
                                overflow: 'hidden',
                            }}
                        >
                            <Table size="small" sx={{ width: 'auto' }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'tint.primaryBg' }}>
                                        <TableCell
                                            colSpan={2}
                                            align="center"
                                            sx={{ fontWeight: 800, color: 'primary.main', py: 0.5 }}
                                        >
                                            Conversions F → P
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 700, py: 0.5 }}>
                                            F
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, py: 0.5 }}>
                                            P
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {TRANSPARENCY_F_TO_P_TABLE.map(([f, p]) => (
                                        <TableRow key={f}>
                                            <TableCell align="center">{f}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                                                {p}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Stack>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ mt: 3, p: 2, bgcolor: 'tint.mutedBg', borderRadius: 3 }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Numérateur (Q)
                            </Typography>
                            <Typography fontWeight={700}>
                                100 × Σ écart = 100 × {totals.sumEcart} = {totals.sumEcart * 100}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Dénominateur (R)
                            </Typography>
                            <Typography fontWeight={700}>
                                {hasSnapshot
                                    ? `Σ P × pairs = ${String(totals.sumP)} × ${String(
                                          snapshot.peer_count
                                      )} = ${String(totals.sumP * snapshot.peer_count)}`
                                    : `Σ P × pairs = ${String(totals.sumP)} × n (en attente d'activation)`}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Score
                            </Typography>
                            <Typography fontWeight={800} color="primary.main">
                                {hasSnapshot
                                    ? `100 − ⌊Q ÷ R⌋ = ${String(snapshot.value)} %`
                                    : 'En attente d’activation'}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
