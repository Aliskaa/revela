// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
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
import { AlertTriangle, BarChart3, Users } from 'lucide-react';
import { Fragment } from 'react';

import { HorizontalTableScrollHint } from '@/components/common/layout';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import type {
    CampaignSynthesisDimension,
    CampaignSynthesisGapCell,
    CampaignSynthesisGapRow,
    CampaignSynthesisMatrix,
    CampaignSynthesisParticipantColumn,
    CampaignSynthesisScoreRow,
} from '@aor/types';

export type CampaignSynthesisMatrixProps = {
    matrix: CampaignSynthesisMatrix;
};

const cellSx = {
    px: 1,
    py: 1,
    fontVariantNumeric: 'tabular-nums' as const,
    textAlign: 'center' as const,
};

const labelCellSx: SxProps<Theme> = {
    px: 2,
    py: 1,
    width: '30%',
    whiteSpace: 'normal',
    color: 'text.primary',
    'tr:hover &': {
        bgcolor: 'surface.lavenderGreyHover',
    },
};

function participantInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/**
 * Matrice de synthèse Élément B au niveau d'une campagne. Reproduit la structure
 * du tableau papier (PDF AOR section 9, image `docs/tab_result_test_admin.jpeg`) :
 * colonnes = participants, lignes = score_keys par dimension + lignes d'écart |e − w|.
 *
 * Les écarts dépassant le seuil `gapWarningThreshold` (4 par défaut, défini côté backend)
 * sont mis en évidence en rouge — décision Nora 2026-05-08.
 */
export function CampaignSynthesisMatrix({ matrix }: CampaignSynthesisMatrixProps) {
    const { participants, dimensions, questionnaireTitle, gapWarningThreshold } = matrix;

    if (participants.length === 0) {
        return (
            <Card variant="outlined" sx={surfaceCardSx}>
                <CardContent sx={{ px: 3, py: 4, textAlign: 'center' }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            mx: 'auto',
                            mb: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                        }}
                    >
                        <BarChart3 size={22} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                        Synthèse en attente
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Aucun participant rattaché à cette campagne pour le moment.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    const respondersCount = participants.filter(p => p.hasResponse).length;
    const responseRate = Math.round((respondersCount / participants.length) * 100);

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
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                Matrice comparative
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 640 }}>
                                {questionnaireTitle} — scores scientifiques par participant, regroupés par dimension.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            <Chip
                                size="small"
                                icon={<Users size={14} />}
                                label={`${respondersCount}/${participants.length} réponses (${responseRate} %)`}
                                sx={{
                                    borderRadius: 99,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    '& .MuiChip-icon': { color: 'primary.main' },
                                }}
                            />
                            <Chip
                                size="small"
                                icon={<AlertTriangle size={14} />}
                                label={`Écart > ${gapWarningThreshold} = alerte`}
                                sx={{
                                    borderRadius: 99,
                                    bgcolor: 'tint.dangerHover',
                                    color: 'tint.dangerText',
                                    fontWeight: 700,
                                    '& .MuiChip-icon': { color: 'tint.dangerText' },
                                }}
                            />
                        </Stack>
                    </Stack>
                </Box>

                {respondersCount === 0 ? (
                    <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Aucun participant n'a encore terminé le test scientifique. La synthèse se remplira au fur
                            et à mesure des soumissions.
                        </Alert>
                    </Box>
                ) : null}

                <Box sx={{ px: { xs: 1, md: 1.5 }, pb: { xs: 2, md: 2.5 }, pt: respondersCount === 0 ? 0 : 2 }}>
                    <HorizontalTableScrollHint
                        sx={{ mb: 2 }}
                        containerSx={{
                            border: '1px solid',
                            borderColor: 'surface.listTableRowBorder',
                            borderRadius: 2,
                        }}
                    >
                        <TableContainer
                            sx={{
                                overflow: 'visible',
                            }}
                        >
                        <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            ...labelCellSx,
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
                                        Dimension / score
                                    </TableCell>
                                    {participants.map(p => (
                                        <ParticipantHeaderCell key={p.participantId} participant={p} />
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dimensions.map(dim => (
                                    <DimensionRows
                                        key={dim.name}
                                        dimension={dim}
                                        participantCount={participants.length}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                        </TableContainer>
                    </HorizontalTableScrollHint>

                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            flexWrap: 'wrap',
                            gap: 1,
                        }}
                    >
                        <LegendSwatch label="Écart critique" tone="danger" />
                        <LegendSwatch label="Donnée manquante" tone="muted" />
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
}

function LegendSwatch({ label, tone }: { label: string; tone: 'danger' | 'muted' }) {
    const swatchSx =
        tone === 'danger'
            ? { bgcolor: 'tint.dangerHover', color: 'tint.dangerText', borderColor: 'error.main' }
            : { bgcolor: 'surface.containerLow', color: 'text.disabled', borderColor: 'border' };

    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
                sx={{
                    width: 18,
                    height: 18,
                    borderRadius: 1,
                    border: '1px solid',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    ...swatchSx,
                }}
            >
                {tone === 'muted' ? '–' : '3'}
            </Box>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
        </Stack>
    );
}

function ParticipantHeaderCell({ participant }: { participant: CampaignSynthesisParticipantColumn }) {
    return (
        <Tooltip
            title={
                participant.hasResponse
                    ? participant.email
                    : `${participant.email} — en attente de réponse`
            }
            placement="top"
        >
            <TableCell
                sx={{
                    ...cellSx,
                    verticalAlign: 'bottom',
                    bgcolor: 'surface.lavenderGrey',
                    borderBottom: '1px solid',
                    borderColor: 'surface.listTableRowBorder',
                }}
            >
                <Stack spacing={0.75} alignItems="center">
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: '0.6875rem',
                            flexShrink: 0,
                            bgcolor: participant.hasResponse ? 'tint.primaryBg' : 'surface.containerLow',
                            color: participant.hasResponse ? 'primary.main' : 'text.disabled',
                            border: '1px solid',
                            borderColor: participant.hasResponse ? 'tint.primaryRail' : 'border',
                        }}
                    >
                        {participantInitials(participant.fullName)}
                    </Box>
                    <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                            display: 'block',
                            maxWidth: 96,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: participant.hasResponse ? 'text.primary' : 'text.disabled',
                        }}
                    >
                        {participant.fullName}
                    </Typography>
                    <Box
                        sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: participant.hasResponse ? 'tint.scientific' : 'tint.mutedBg',
                        }}
                    />
                </Stack>
            </TableCell>
        </Tooltip>
    );
}

function DimensionRows({
    dimension,
    participantCount,
}: {
    dimension: CampaignSynthesisDimension;
    participantCount: number;
}) {
    const rowsByKey = new Map(dimension.rows.map(r => [r.scoreKey, r]));
    const pairedKeys = new Set<number>();
    for (const gap of dimension.gaps) {
        pairedKeys.add(gap.eScoreKey);
        pairedKeys.add(gap.wScoreKey);
    }
    const looseRows = dimension.rows.filter(r => !pairedKeys.has(r.scoreKey));

    return (
        <>
            <TableRow sx={{ bgcolor: 'tint.primaryWash' }}>
                <TableCell
                    colSpan={participantCount + 1}
                    sx={{
                        py: 1.1,
                        px: 2,
                        fontWeight: 800,
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontSize: '0.6875rem',
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                    }}
                >
                    {dimension.name}
                </TableCell>
            </TableRow>
            {dimension.gaps.map(gap => {
                const eRow = rowsByKey.get(gap.eScoreKey);
                const wRow = rowsByKey.get(gap.wScoreKey);
                return (
                    <Fragment key={`pair-${gap.eScoreKey}-${gap.wScoreKey}`}>
                        {eRow ? <ScoreRow row={eRow} /> : null}
                        {wRow ? <ScoreRow row={wRow} /> : null}
                        <GapRow gap={gap} />
                    </Fragment>
                );
            })}
            {looseRows.map(row => (
                <ScoreRow key={`loose-${row.scoreKey}`} row={row} />
            ))}
        </>
    );
}

function ScoreRow({ row }: { row: CampaignSynthesisScoreRow }) {
    return (
        <TableRow
            hover
            sx={{
                '&:hover': { bgcolor: 'surface.lavenderGreyHover' },
                '& td': { borderColor: 'surface.listTableRowBorder' },
            }}
        >
            <TableCell sx={labelCellSx}>
                <Typography variant="body2" fontWeight={600}>
                    {row.label}
                </Typography>
            </TableCell>
            {row.values.map((v, idx) => (
                <TableCell
                    key={`${row.scoreKey}-${String(idx)}`}
                    sx={{
                        ...cellSx,
                        fontWeight: 600,
                        color: v === null ? 'text.disabled' : 'text.primary',
                        bgcolor: v === null ? 'transparent' : 'tint.primaryGhost',
                    }}
                >
                    {v ?? '–'}
                </TableCell>
            ))}
        </TableRow>
    );
}

function GapRow({ gap }: { gap: CampaignSynthesisGapRow }) {
    return (
        <TableRow
            sx={{
                bgcolor: 'tint.subtleRow',
                '& td': { borderColor: 'surface.listTableRowBorder' },
            }}
        >
            <TableCell
                sx={{
                    ...labelCellSx,
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    bgcolor: 'tint.subtleRow',
                }}
            >
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.04em' }}>
                    {gap.label}
                </Typography>
            </TableCell>
            {gap.cells.map((cell, idx) => (
                <GapCellView key={`${gap.eScoreKey}-${gap.wScoreKey}-${String(idx)}`} cell={cell} />
            ))}
        </TableRow>
    );
}

function GapCellView({ cell }: { cell: CampaignSynthesisGapCell }) {
    if (cell.value === null) {
        return (
            <TableCell sx={{ ...cellSx, color: 'text.disabled' }}>
                –
            </TableCell>
        );
    }

    if (cell.warning) {
        return (
            <TableCell sx={cellSx}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        minWidth: 30,
                        px: 0.875,
                        py: 0.375,
                        borderRadius: 99,
                        border: '2px solid',
                        borderColor: 'error.main',
                        bgcolor: 'tint.dangerHover',
                        color: 'tint.dangerText',
                        fontWeight: 800,
                        justifyContent: 'center',
                        boxShadow: theme => theme.palette.shadow.brandWhisper,
                    }}
                >
                    {cell.value}
                </Box>
            </TableCell>
        );
    }

    return (
        <TableCell sx={{ ...cellSx, color: 'text.secondary', fontWeight: 600 }}>
            {cell.value}
        </TableCell>
    );
}
