// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Users } from 'lucide-react';
import * as React from 'react';

import { ParticipantAvatar } from '@/components/common/ParticipantAvatar';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { personInitialsFromLabel } from '@/lib/personInitials';
import type { ParticipantQuestionnaireMatrix, TransparencySnapshot } from '@aor/types';
import { transparencyConvertFToP } from '@aor/types';

import { TransparencyFToPMappingPopover } from './TransparencyFToPMappingPopover';

export type CampaignParticipantTransparencyMatrixProps = {
    matrix: ParticipantQuestionnaireMatrix;
    peerCount: number;
    snapshot: TransparencySnapshot | null;
    /** Masque les pastilles d’initiales (ex. vue participant avec pairs anonymisés). */
    showPeerAvatars?: boolean;
};

type RowComputation = {
    score_key: number;
    label: string;
    scientific: number | null;
    peers: ReadonlyArray<number | null>;
    ecarts: ReadonlyArray<number | null>;
    p: number | null;
};

const cellSx = {
    px: 0.75,
    py: 0.875,
    fontVariantNumeric: 'tabular-nums' as const,
    textAlign: 'center' as const,
};

const fCellSx: SxProps<Theme> = {
    ...cellSx,
    px: 0.25,
    width: 36,
    minWidth: 36,
    maxWidth: 36,
};

const pCellSx: SxProps<Theme> = {
    ...cellSx,
    px: 0.25,
    width: 52,
    minWidth: 52,
    maxWidth: 52,
    whiteSpace: 'nowrap',
};

const labelCellSx: SxProps<Theme> = {
    px: 1.25,
    py: 1,
    whiteSpace: 'normal',
    color: 'text.primary',
    'tr:hover &': {
        bgcolor: 'surface.lavenderGreyHover',
    },
};

const dimensionCellSx: SxProps<Theme> = {
    ...labelCellSx,
    width: '18%',
};

const peerHeaderCellSx: SxProps<Theme> = {
    ...cellSx,
    px: 0.5,
    py: 1.25,
    verticalAlign: 'bottom',
    borderBottom: '1px solid',
    borderColor: 'surface.listTableRowBorder',
};

const ecartLabelSx: SxProps<Theme> = {
    fontSize: '0.5625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'text.secondary',
    lineHeight: 1,
};

const peerLabelSx: SxProps<Theme> = {
    display: 'block',
    maxWidth: 72,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'text.primary',
    lineHeight: 1.2,
};

function PeerColumnHeader({
    label,
    fallbackLabel,
    avatarUrl = null,
    showEcartLabel = false,
    showAvatar = true,
    bgcolor,
}: {
    label: string;
    fallbackLabel: string;
    avatarUrl?: string | null;
    showEcartLabel?: boolean;
    showAvatar?: boolean;
    bgcolor: string;
}) {
    const displayName = label.length > 0 ? label : fallbackLabel;

    return (
        <TableCell
            align="center"
            sx={{
                ...peerHeaderCellSx,
                bgcolor,
            }}
        >
            {showAvatar ? (
                <Tooltip title={displayName} placement="top">
                    <Stack spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                        {showEcartLabel ? (
                            <Typography variant="caption" fontWeight={800} sx={ecartLabelSx}>
                                Écart
                            </Typography>
                        ) : null}
                        <ParticipantAvatar
                            src={avatarUrl}
                            initials={personInitialsFromLabel(displayName)}
                            alt={displayName}
                            size={32}
                            sx={{
                                borderRadius: 2,
                                fontWeight: 800,
                                fontSize: '0.625rem',
                                bgcolor: showEcartLabel ? 'surface.containerLow' : 'tint.primaryBg',
                                color: showEcartLabel ? 'text.secondary' : 'primary.main',
                                border: '1px solid',
                                borderColor: showEcartLabel ? 'border' : 'tint.primaryRail',
                            }}
                        />
                        <Typography variant="caption" fontWeight={700} sx={peerLabelSx}>
                            {displayName}
                        </Typography>
                    </Stack>
                </Tooltip>
            ) : (
                <Stack spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                    {showEcartLabel ? (
                        <Typography variant="caption" fontWeight={800} sx={ecartLabelSx}>
                            Écart
                        </Typography>
                    ) : null}
                    <Typography variant="caption" fontWeight={700} sx={peerLabelSx}>
                        {displayName}
                    </Typography>
                </Stack>
            )}
        </TableCell>
    );
}

export function CampaignParticipantTransparencyMatrix({
    matrix,
    peerCount,
    snapshot,
    showPeerAvatars = true,
}: CampaignParticipantTransparencyMatrixProps) {
    const hasSnapshot = snapshot !== null;
    const rows = React.useMemo<RowComputation[]>(() => {
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

    return (
        <Card variant="outlined" sx={surfaceCardSx}>
            <CardContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        pt: { xs: 2.5, md: 3 },
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'surface.lavenderGrey',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.5}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                Matrice de calcul
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Scores scientifiques (F), retours pairs, écarts et conversions F → P.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                icon={<Users size={14} />}
                                label={`${peerCount} feedback${peerCount > 1 ? 's' : ''} pair${peerCount > 1 ? 's' : ''}`}
                                sx={{
                                    borderRadius: 99,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    '& .MuiChip-icon': { color: 'primary.main' },
                                }}
                            />
                            <TransparencyFToPMappingPopover />
                        </Stack>
                    </Stack>
                </Box>

                <Box sx={{ px: { xs: 1, md: 1.5 }, py: 2 }}>
                    <TableContainer
                        sx={{
                            border: '1px solid',
                            borderColor: 'surface.listTableRowBorder',
                            borderRadius: 2,
                            overflow: 'visible',
                        }}
                    >
                        <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            ...dimensionCellSx,
                                            fontWeight: 800,
                                            fontSize: '0.6875rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'text.secondary',
                                            bgcolor: 'surface.lavenderGrey',
                                            borderBottom: '1px solid',
                                            borderColor: 'surface.listTableRowBorder',
                                        }}
                                    >
                                        Dimension
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            ...fCellSx,
                                            fontWeight: 800,
                                            fontSize: '0.6875rem',
                                            bgcolor: 'tint.mutedBg',
                                            borderBottom: '1px solid',
                                            borderColor: 'surface.listTableRowBorder',
                                        }}
                                    >
                                        F
                                    </TableCell>
                                    {matrix.peer_columns.map((col, i) => (
                                        <PeerColumnHeader
                                            key={`peer-${col.response_id}`}
                                            label={col.label}
                                            fallbackLabel={`Pair #${i + 1}`}
                                            avatarUrl={col.avatar_url}
                                            showAvatar={showPeerAvatars}
                                            bgcolor="surface.lavenderGrey"
                                        />
                                    ))}
                                    {matrix.peer_columns.map((col, i) => (
                                        <PeerColumnHeader
                                            key={`ecart-${col.response_id}`}
                                            label={col.label}
                                            fallbackLabel={`#${i + 1}`}
                                            avatarUrl={col.avatar_url}
                                            showEcartLabel
                                            showAvatar={showPeerAvatars}
                                            bgcolor="tint.subtleRow"
                                        />
                                    ))}
                                    <TableCell
                                        align="center"
                                        sx={{
                                            ...pCellSx,
                                            fontWeight: 800,
                                            fontSize: '0.6875rem',
                                            color: 'tint.scientific',
                                            bgcolor: 'tint.scientificBg',
                                            borderBottom: '1px solid',
                                            borderColor: 'surface.listTableRowBorder',
                                        }}
                                    >
                                        P
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map(row => (
                                    <TableRow
                                        key={row.score_key}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: 'surface.lavenderGreyHover' },
                                            '& td': { borderColor: 'surface.listTableRowBorder' },
                                        }}
                                    >
                                        <TableCell sx={{ ...dimensionCellSx, fontWeight: 600 }}>{row.label}</TableCell>
                                        <TableCell align="center" sx={{ ...fCellSx, bgcolor: 'tint.mutedBg' }}>
                                            {row.scientific ?? '—'}
                                        </TableCell>
                                        {row.peers.map((peer, i) => (
                                            <TableCell
                                                key={`p-${row.score_key}-${matrix.peer_columns[i]?.response_id ?? i}`}
                                                align="center"
                                                sx={cellSx}
                                            >
                                                {peer ?? '—'}
                                            </TableCell>
                                        ))}
                                        {row.ecarts.map((ecart, i) => (
                                            <TableCell
                                                key={`e-${row.score_key}-${matrix.peer_columns[i]?.response_id ?? i}`}
                                                align="center"
                                                sx={{ ...cellSx, bgcolor: 'tint.subtleRow', color: 'text.secondary' }}
                                            >
                                                {ecart ?? '—'}
                                            </TableCell>
                                        ))}
                                        <TableCell
                                            align="center"
                                            sx={{
                                                ...pCellSx,
                                                bgcolor: 'tint.scientificBg',
                                                color: 'tint.scientific',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {row.p ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ '& td': { borderTop: '2px solid', borderTopColor: 'border' } }}>
                                    <TableCell sx={{ ...dimensionCellSx, fontWeight: 800 }}>Total</TableCell>
                                    <TableCell align="center" sx={{ ...fCellSx, bgcolor: 'tint.mutedBg' }} />
                                    {matrix.peer_columns.map(col => (
                                        <TableCell key={`p-total-${col.response_id}`} align="center" sx={cellSx} />
                                    ))}
                                    <TableCell
                                        align="center"
                                        colSpan={Math.max(peerCount, 1)}
                                        sx={{ ...cellSx, bgcolor: 'tint.subtleRow', fontWeight: 800 }}
                                    >
                                        Σ écart = {totals.sumEcart}
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            ...pCellSx,
                                            bgcolor: 'tint.scientificBg',
                                            color: 'tint.scientific',
                                            fontWeight: 800,
                                            fontSize: '0.625rem',
                                        }}
                                    >
                                        Σ P = {totals.sumP}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'surface.lavenderGrey',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'surface.listTableRowBorder',
                        }}
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
                                    ? `Σ P × pairs = ${String(totals.sumP)} × ${String(snapshot.peer_count)} = ${String(totals.sumP * snapshot.peer_count)}`
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
                </Box>
            </CardContent>
        </Card>
    );
}
