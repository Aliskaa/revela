// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantQuestionnaireMatrix, ParticipantQuestionnaireMatrixRow } from '@aor/types';
import {
    Box,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { MessageSquareText } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import { ListTableHead, type ListTableColumn } from '@/components/common/data-table';
import { HorizontalTableScrollHint } from '@/components/common/layout';
import {
    tableCellSx,
    listRowSx,
    surfaceCardSx,
} from '@/components/common/styles/listSurfaces';

import { type PairBlock, absDiff, buildDimensionBlocks } from './pairBuilder';

const EDGE_X = 5;

type MatrixTableModeProps = {
    matrix: ParticipantQuestionnaireMatrix;
    showInterpretations?: boolean;
};

export function MatrixTableMode({ matrix, showInterpretations = true }: MatrixTableModeProps) {
    const blocks = buildDimensionBlocks(matrix);
    const totalCols = 2 + matrix.peer_columns.length + 1;

    const columns = useMemo<ListTableColumn[]>(
        () => [
            { key: 'dimension', label: 'Dimensions évaluées', sx: { pl: EDGE_X, minWidth: 250 } },
            { key: 'self', label: 'Regard sur soi', align: 'center', sx: { color: 'primary.main' } },
            ...matrix.peer_columns.map((col, i) => ({
                key: `peer-${col.response_id ?? i}`,
                label: col.label,
                align: 'center' as const,
            })),
            {
                key: 'scientific',
                label: 'Scientifique',
                align: 'center',
                sx: { color: 'tint.scientific', pr: EDGE_X },
            },
        ],
        [matrix.peer_columns]
    );

    const renderRow = (row: ParticipantQuestionnaireMatrixRow) => (
        <TableRow key={`row-${row.score_key}`} hover sx={listRowSx}>
            <TableCell sx={{ pl: EDGE_X, ...tableCellSx }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                    {row.label}
                </Typography>
            </TableCell>
            <TableCell
                align="center"
                sx={{
                    ...tableCellSx,
                    fontWeight: 700,
                    color: 'primary.main',
                    bgcolor: 'tint.primaryGhost',
                }}
            >
                {row.self ?? '—'}
            </TableCell>
            {row.peers.map((v, i) => {
                const comment = row.peer_comments[i] ?? null;
                const cellContent =
                    comment !== null ? (
                        <Tooltip
                            title={
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {comment}
                                </Typography>
                            }
                            arrow
                        >
                            <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center">
                                <span>{v ?? '—'}</span>
                                <MessageSquareText size={12} />
                            </Stack>
                        </Tooltip>
                    ) : (
                        <span>{v ?? '—'}</span>
                    );
                return (
                    <TableCell
                        key={`${row.score_key}-${matrix.peer_columns[i]?.response_id ?? i}`}
                        align="center"
                        sx={{ ...tableCellSx, fontWeight: 500, color: 'text.secondary' }}
                    >
                        {cellContent}
                    </TableCell>
                );
            })}
            <TableCell
                align="center"
                sx={{
                    pr: EDGE_X,
                    ...tableCellSx,
                    fontWeight: 700,
                    color: 'tint.scientific',
                    bgcolor: 'tint.scientificBg',
                }}
            >
                {row.scientific ?? '—'}
            </TableCell>
        </TableRow>
    );

    const renderGapRow = (pair: PairBlock) => {
        const selfGap = absDiff(pair.eRow.self, pair.wRow.self);
        const sciGap = absDiff(pair.eRow.scientific, pair.wRow.scientific);
        const peerGaps = pair.eRow.peers.map((e, i) => absDiff(e, pair.wRow.peers[i] ?? null));
        const fmt = (v: number | null) => (v === null ? '—' : v);
        const pickGapLabel = (a: number | null, b: number | null): string | null => {
            if (a === null || b === null || !pair.ifEGt || !pair.ifWGt) return null;
            if (a > b) return pair.ifEGt;
            if (b > a) return pair.ifWGt;
            return null;
        };
        const renderGapCell = (
            value: number | null,
            label: string | null,
            sx: Record<string, unknown>,
            key: string
        ) => (
            <TableCell key={key} align="center" sx={{ verticalAlign: 'top', ...tableCellSx, ...sx }}>
                <Stack spacing={0.5} alignItems="center">
                    <span>{fmt(value)}</span>
                    {showInterpretations && label !== null && (
                        <Typography
                            variant="caption"
                            color="text.primary"
                            sx={{ fontStyle: 'italic', fontWeight: 400, lineHeight: 1.35 }}
                        >
                            {label}
                        </Typography>
                    )}
                </Stack>
            </TableCell>
        );
        return (
            <TableRow key={`gap-${pair.eRow.score_key}-${pair.wRow.score_key}`} sx={{ bgcolor: 'tint.subtleRow' }}>
                <TableCell sx={{ pl: EDGE_X, py: 1.5, verticalAlign: 'top' }}>
                    <Typography
                        variant="caption"
                        fontWeight={800}
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >
                        Écart
                    </Typography>
                </TableCell>
                {renderGapCell(
                    selfGap,
                    null,
                    { fontWeight: 800, color: 'primary.main' },
                    `gap-${pair.eRow.score_key}-self`
                )}
                {peerGaps.map((g, i) =>
                    renderGapCell(
                        g,
                        null,
                        { fontWeight: 700, color: 'text.secondary' },
                        `gap-${pair.eRow.score_key}-peer-${matrix.peer_columns[i]?.response_id ?? i}`
                    )
                )}
                {renderGapCell(
                    sciGap,
                    pickGapLabel(pair.eRow.scientific, pair.wRow.scientific),
                    { fontWeight: 800, color: 'tint.scientific', pr: EDGE_X },
                    `gap-${pair.eRow.score_key}-sci`
                )}
            </TableRow>
        );
    };

    const renderDimensionHeader = (name: string) =>
        name.length === 0 ? null : (
            <TableRow key={`dim-${name}`} sx={{ bgcolor: 'tint.primaryWash' }}>
                <TableCell colSpan={totalCols} sx={{ py: 1.5, pl: EDGE_X }}>
                    <Typography
                        variant="caption"
                        fontWeight={800}
                        color="primary.main"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >
                        {name}
                    </Typography>
                </TableCell>
            </TableRow>
        );

    return (
        <HorizontalTableScrollHint sx={{ width: '100%', ...surfaceCardSx }} containerSx={{ width: '100%' }}>
            <Table size="medium" sx={{ minWidth: 720 }}>
                <ListTableHead columns={columns} />
                <TableBody>
                    {blocks.map(block => (
                        <Fragment key={`block-${block.name || 'noname'}`}>
                            {renderDimensionHeader(block.name)}
                            {block.pairs.flatMap(pair => [
                                renderRow(pair.eRow),
                                renderRow(pair.wRow),
                                renderGapRow(pair),
                            ])}
                            {block.looseRows.map(renderRow)}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </HorizontalTableScrollHint>
    );
};
