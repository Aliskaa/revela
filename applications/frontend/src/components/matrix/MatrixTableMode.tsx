import type { ParticipantQuestionnaireMatrix, ParticipantQuestionnaireMatrixRow } from '@aor/types';
import {
    Paper,
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
import { MessageSquareText } from 'lucide-react';
import { Fragment } from 'react';

import { type PairBlock, absDiff, buildDimensionBlocks } from './pairBuilder';

type MatrixTableModeProps = {
    matrix: ParticipantQuestionnaireMatrix;
    showInterpretations?: boolean;
};

export function MatrixTableMode({ matrix, showInterpretations = true }: MatrixTableModeProps) {
    const peerHeaders = matrix.peer_columns.map(c => c.label);
    const blocks = buildDimensionBlocks(matrix);
    const totalCols = 2 + peerHeaders.length + 1;

    const renderRow = (row: ParticipantQuestionnaireMatrixRow) => (
        <TableRow key={`row-${row.score_key}`} hover>
            <TableCell sx={{ py: 1.6 }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                    {row.label}
                </Typography>
            </TableCell>
            <TableCell
                align="center"
                sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'tint.primaryGhost' }}
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
                        sx={{ fontWeight: 500, color: 'text.secondary' }}
                    >
                        {cellContent}
                    </TableCell>
                );
            })}
            <TableCell align="center" sx={{ fontWeight: 700, color: 'tint.scientific', bgcolor: 'tint.scientificBg' }}>
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
            <TableCell key={key} align="center" sx={{ verticalAlign: 'top', ...sx }}>
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
            <TableRow
                key={`gap-${pair.eRow.score_key}-${pair.wRow.score_key}`}
                sx={{ bgcolor: 'tint.subtleRow' }}
            >
                <TableCell sx={{ py: 1.2, verticalAlign: 'top' }}>
                    <Typography
                        variant="caption"
                        fontWeight={800}
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
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
                    { fontWeight: 800, color: 'tint.scientific' },
                    `gap-${pair.eRow.score_key}-sci`
                )}
            </TableRow>
        );
    };

    const renderDimensionHeader = (name: string) =>
        name.length === 0 ? null : (
            <TableRow key={`dim-${name}`} sx={{ bgcolor: 'tint.primaryWash' }}>
                <TableCell colSpan={totalCols} sx={{ py: 1.2 }}>
                    <Typography
                        variant="caption"
                        fontWeight={800}
                        color="primary.main"
                        sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}
                    >
                        {name}
                    </Typography>
                </TableCell>
            </TableRow>
        );

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, boxShadow: 'none' }}>
            <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                        <TableCell
                            sx={{
                                fontWeight: 800,
                                minWidth: 250,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                py: 2,
                            }}
                        >
                            Dimensions évaluées
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={{
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'primary.main',
                                py: 2,
                            }}
                        >
                            Regard sur soi
                        </TableCell>
                        {peerHeaders.map((label, i) => (
                            <TableCell
                                key={matrix.peer_columns[i]?.response_id ?? i}
                                align="center"
                                sx={{
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    py: 2,
                                }}
                            >
                                {label}
                            </TableCell>
                        ))}
                        <TableCell
                            align="center"
                            sx={{
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'tint.scientific',
                                py: 2,
                            }}
                        >
                            Scientifique
                        </TableCell>
                    </TableRow>
                </TableHead>
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
        </TableContainer>
    );
}
