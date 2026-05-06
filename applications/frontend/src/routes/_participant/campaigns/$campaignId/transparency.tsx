// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useParticipantOwnTransparency } from '@/hooks/transparency';
import { TRANSPARENCY_F_TO_P_TABLE, transparencyConvertFToP } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ScanEye } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/transparency')({
    component: ParticipantTransparencyRoute,
});

// Table de conversion F → P : source de vérité dans `@aor/types`, partagée avec le backend.

type RowComputation = {
    score_key: number;
    label: string;
    scientific: number | null;
    peers: ReadonlyArray<number | null>;
    ecarts: ReadonlyArray<number | null>;
    p: number | null;
};

function ParticipantTransparencyRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);

    const { data: session, isLoading: sessionLoading } = useParticipantSession();
    const { data: envelope, isLoading: envelopeLoading } = useParticipantOwnTransparency(
        Number.isFinite(campaignId) ? campaignId : null
    );

    const assignment = React.useMemo(
        () => session?.assignments.find(a => a.campaign_id === campaignId),
        [session, campaignId]
    );
    const qid = assignment?.questionnaire_id ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        Number.isFinite(campaignId) ? campaignId : undefined,
        'received'
    );

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

    const isLoading = sessionLoading || envelopeLoading || matrixLoading;

    if (isLoading) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                        Chargement du repère de transparence
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    if (!assignment) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">Aucune campagne trouvée pour cet identifiant.</Alert>
                <Link to="/campaigns/$campaignId" params={{ campaignId: String(campaignId) }}>
                    <Button startIcon={<ArrowLeft size={16} />} variant="outlined" sx={{ borderRadius: 3, alignSelf: 'flex-start' }}>
                        Retour à la campagne
                    </Button>
                </Link>
            </Stack>
        );
    }

    if (snapshot === null) {
        return (
            <Stack spacing={2}>
                <Alert severity="info">
                    Le repère de transparence n'a pas encore été activé par votre coach. Vous pourrez consulter le détail
                    une fois le calcul lancé.
                </Alert>
                <Link to="/campaigns/$campaignId" params={{ campaignId: String(campaignId) }}>
                    <Button startIcon={<ArrowLeft size={16} />} variant="outlined" sx={{ borderRadius: 3, alignSelf: 'flex-start' }}>
                        Retour à la campagne
                    </Button>
                </Link>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <Link to="/campaigns/$campaignId" params={{ campaignId: String(campaignId) }}>
                <Button startIcon={<ArrowLeft size={16} />} variant="outlined" sx={{ borderRadius: 3, alignSelf: 'flex-start' }}>
                    Retour à la campagne
                </Button>
            </Link>

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
                                        Suite à {snapshot.peer_count}{' '}
                                        {snapshot.peer_count > 1 ? 'feedbacks pairs' : 'feedback pair'} reçus.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
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
                                        {Array.from({ length: peerCount }).map((_, i) => (
                                            <TableCell
                                                // biome-ignore lint/suspicious/noArrayIndexKey: colonnes pair numérotées, pas de réorganisation possible.
                                                key={`peer-${String(i)}`}
                                                align="center"
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Pair #{i + 1}
                                            </TableCell>
                                        ))}
                                        {Array.from({ length: peerCount }).map((_, i) => (
                                            <TableCell
                                                // biome-ignore lint/suspicious/noArrayIndexKey: colonnes écart numérotées, pas de réorganisation possible.
                                                key={`ecart-${String(i)}`}
                                                align="center"
                                                sx={{ fontWeight: 700, bgcolor: 'tint.warningBg' }}
                                            >
                                                Écart #{i + 1}
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
                                                // biome-ignore lint/suspicious/noArrayIndexKey: colonnes pair, pas de réorganisation possible.
                                                <TableCell key={`p-${String(row.score_key)}-${String(i)}`} align="center">
                                                    {peer ?? '—'}
                                                </TableCell>
                                            ))}
                                            {row.ecarts.map((ecart, i) => (
                                                <TableCell
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: colonnes écart, pas de réorganisation possible.
                                                    key={`e-${String(row.score_key)}-${String(i)}`}
                                                    align="center"
                                                    sx={{ bgcolor: 'tint.warningBg' }}
                                                >
                                                    {ecart ?? '—'}
                                                </TableCell>
                                            ))}
                                            <TableCell align="center" sx={{ bgcolor: 'tint.primaryBg', fontWeight: 700 }}>
                                                {row.p ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ '& td': { borderTop: '2px solid', borderTopColor: 'border' } }}>
                                        <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: 'tint.mutedBg' }} />
                                        {Array.from({ length: peerCount }).map((_, i) => (
                                            <TableCell
                                                // biome-ignore lint/suspicious/noArrayIndexKey: colonnes pair, pas de réorganisation possible.
                                                key={`p-total-${String(i)}`}
                                                align="center"
                                            />
                                        ))}
                                        <TableCell
                                            align="center"
                                            colSpan={peerCount}
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
                                            <TableCell align="center">
                                                {f}
                                            </TableCell>
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
                                Σ P × pairs = {totals.sumP} × {snapshot.peer_count} ={' '}
                                {totals.sumP * snapshot.peer_count}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Score
                            </Typography>
                            <Typography fontWeight={800} color="primary.main">
                                100 − ⌊Q ÷ R⌋ = {snapshot.value} %
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
