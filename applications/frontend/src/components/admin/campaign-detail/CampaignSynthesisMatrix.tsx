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
import { Fragment } from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
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
    px: 1.25,
    py: 0.75,
    fontVariantNumeric: 'tabular-nums' as const,
    textAlign: 'center' as const,
    minWidth: 64,
};

const labelCellSx = {
    px: 1.5,
    py: 0.75,
    minWidth: 240,
    maxWidth: 320,
    whiteSpace: 'normal' as const,
    color: 'text.primary',
};

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
            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Synthèse Élément B"
                        subtitle="Aucun participant rattaché à cette campagne pour le moment."
                    />
                </CardContent>
            </Card>
        );
    }

    const respondersCount = participants.filter(p => p.hasResponse).length;

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Synthèse Élément B"
                    subtitle={`${questionnaireTitle} — comparaison des scores scientifiques par participant.`}
                />

                <Stack direction="row" spacing={1.2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                        size="small"
                        label={`${respondersCount} / ${participants.length} ont répondu`}
                        sx={{ borderRadius: 99 }}
                    />
                    <Chip
                        size="small"
                        label={`Écart > ${gapWarningThreshold} = alerte`}
                        sx={{
                            borderRadius: 99,
                            bgcolor: 'rgba(220,38,38,0.08)',
                            color: 'rgb(185,28,28)',
                            fontWeight: 600,
                        }}
                    />
                </Stack>

                {respondersCount === 0 && (
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        Aucun participant n'a encore terminé le test scientifique. La synthèse se remplira au fur
                        et à mesure des soumissions.
                    </Alert>
                )}

                <TableContainer sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table size="small" sx={{ tableLayout: 'fixed' }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(15,23,42,0.04)' }}>
                                <TableCell sx={{ ...labelCellSx, fontWeight: 700 }}></TableCell>
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
            </CardContent>
        </Card>
    );
}

function ParticipantHeaderCell({ participant }: { participant: CampaignSynthesisParticipantColumn }) {
    return (
        <Tooltip title={participant.email} placement="top">
            <TableCell
                sx={{
                    ...cellSx,
                    fontWeight: 700,
                    minWidth: 96,
                    color: participant.hasResponse ? 'text.primary' : 'text.disabled',
                }}
            >
                {participant.fullName}
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
    // Cf. MatrixTableMode : on intercale chaque ligne d'écart juste sous la paire (e, w)
    // qu'elle compare, plutôt que de les regrouper en fin de dimension.
    const rowsByKey = new Map(dimension.rows.map(r => [r.scoreKey, r]));
    const pairedKeys = new Set<number>();
    for (const gap of dimension.gaps) {
        pairedKeys.add(gap.eScoreKey);
        pairedKeys.add(gap.wScoreKey);
    }
    const looseRows = dimension.rows.filter(r => !pairedKeys.has(r.scoreKey));

    return (
        <>
            <TableRow sx={{ bgcolor: 'tint.primaryBg' }}>
                <TableCell
                    colSpan={participantCount + 1}
                    sx={{
                        py: 1,
                        px: 1.5,
                        fontWeight: 700,
                        color: 'primary.main',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        fontSize: '0.75rem',
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
                        {eRow && <ScoreRow row={eRow} />}
                        {wRow && <ScoreRow row={wRow} />}
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
        <TableRow>
            <TableCell sx={labelCellSx}>
                <Typography variant="body2">{row.label}</Typography>
            </TableCell>
            {row.values.map((v, idx) => (
                <TableCell
                    key={`${row.scoreKey}-${String(idx)}`}
                    sx={{ ...cellSx, color: v === null ? 'text.disabled' : 'text.primary' }}
                >
                    {v ?? '–'}
                </TableCell>
            ))}
        </TableRow>
    );
}

function GapRow({ gap }: { gap: CampaignSynthesisGapRow }) {
    return (
        <TableRow sx={{ bgcolor: 'rgba(15,23,42,0.02)' }}>
            <TableCell sx={{ ...labelCellSx, fontStyle: 'italic', color: 'text.secondary' }}>
                <Typography variant="body2">
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
        return <TableCell sx={{ ...cellSx, color: 'text.disabled' }}>–</TableCell>;
    }
    if (cell.warning) {
        return (
            <TableCell sx={cellSx}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        minWidth: 28,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        border: '2px solid',
                        borderColor: 'rgb(220,38,38)',
                        color: 'rgb(185,28,28)',
                        fontWeight: 700,
                        justifyContent: 'center',
                    }}
                >
                    {cell.value}
                </Box>
            </TableCell>
        );
    }
    return <TableCell sx={{ ...cellSx, color: 'rgb(4,120,87)', fontWeight: 600 }}>{cell.value}</TableCell>;
}
