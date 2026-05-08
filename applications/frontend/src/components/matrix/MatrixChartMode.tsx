import type { ParticipantQuestionnaireMatrix, ParticipantQuestionnaireMatrixRow } from '@aor/types';
import { Box, Chip, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { MessageSquareText } from 'lucide-react';

import { type DimensionBlock, type PairBlock, absDiff, buildDimensionBlocks } from './pairBuilder';

type MatrixChartModeProps = {
    matrix: ParticipantQuestionnaireMatrix;
    showInterpretations?: boolean;
};

function pct(value: number | null, max: number): number {
    if (value === null || max <= 0) return 0;
    return Math.min(100, (value / max) * 100);
}

function MiniBar(props: {
    label: string;
    value: number | null;
    max: number;
    color?: string;
    comment?: string | null;
}) {
    const { label, value, max, color = '#1515B0', comment } = props;
    const valueRow = (
        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.5, mb: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color }}>
                {value ?? '—'}
            </Typography>
            {comment ? (
                <Tooltip
                    title={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {comment}
                        </Typography>
                    }
                    arrow
                >
                    <Box component="span" sx={{ display: 'inline-flex', color, opacity: 0.7, cursor: 'help' }}>
                        <MessageSquareText size={14} />
                    </Box>
                </Tooltip>
            ) : null}
        </Stack>
    );
    return (
        <Box
            sx={{
                flex: '1 1 140px',
                minWidth: 120,
                p: 1.5,
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                display="block"
                textTransform="uppercase"
                letterSpacing={0.5}
                noWrap
            >
                {label}
            </Typography>
            {valueRow}
            <LinearProgress
                variant="determinate"
                value={pct(value, max)}
                sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                }}
            />
        </Box>
    );
}

function GapPill({ label, gap, color }: { label: string; gap: number | null; color: string }) {
    return (
        <Chip
            size="small"
            label={
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.6 }}>
                    <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8 }}>
                        {label}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 800 }}>
                        {gap ?? '—'}
                    </Box>
                </Box>
            }
            sx={{
                borderRadius: 99,
                bgcolor: 'background.default',
                color,
                border: '1px solid',
                borderColor: gap === null ? 'divider' : color,
                fontWeight: 700,
            }}
        />
    );
}

function RowBars({ matrix, row }: { matrix: ParticipantQuestionnaireMatrix; row: ParticipantQuestionnaireMatrixRow }) {
    return (
        <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.2, color: 'text.primary' }}>
                {row.label}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.4} useFlexGap>
                <MiniBar label="Regard sur soi" value={row.self} max={matrix.likert_max} color="#1515B0" />
                {row.peers.map((v, i) => (
                    <MiniBar
                        key={matrix.peer_columns[i]?.response_id ?? i}
                        label={matrix.peer_columns[i]?.label ?? `Pair ${i + 1}`}
                        value={v}
                        max={matrix.likert_max}
                        color="#83D8F5"
                        comment={row.peer_comments[i] ?? null}
                    />
                ))}
                <MiniBar
                    label="Analyse Scientifique"
                    value={row.scientific}
                    max={matrix.scientific_value_max}
                    color="#8BD7B7"
                />
            </Stack>
        </Box>
    );
}

function GapBlock({
    pillLabel,
    gap,
    color,
    interpretation,
    showInterpretations,
}: {
    pillLabel: string;
    gap: number | null;
    color: string;
    interpretation: string | null;
    showInterpretations: boolean;
}) {
    return (
        <Stack spacing={0.6} alignItems="flex-start" sx={{ minWidth: 140, maxWidth: 240 }}>
            <GapPill label={pillLabel} gap={gap} color={color} />
            {showInterpretations && interpretation !== null && (
                <Typography
                    variant="caption"
                    color="text.primary"
                    sx={{ fontStyle: 'italic', lineHeight: 1.35 }}
                >
                    {interpretation}
                </Typography>
            )}
        </Stack>
    );
}

function GapPanel({
    matrix,
    pair,
    showInterpretations,
}: {
    matrix: ParticipantQuestionnaireMatrix;
    pair: PairBlock;
    showInterpretations: boolean;
}) {
    const { eRow, wRow, ifEGt, ifWGt } = pair;
    const selfGap = absDiff(eRow.self, wRow.self);
    const sciGap = absDiff(eRow.scientific, wRow.scientific);
    const peerGaps = eRow.peers.map((e, i) => absDiff(e, wRow.peers[i] ?? null));
    const pickGapLabel = (a: number | null, b: number | null): string | null => {
        if (a === null || b === null || !ifEGt || !ifWGt) return null;
        if (a > b) return ifEGt;
        if (b > a) return ifWGt;
        return null;
    };

    return (
        <Box
            sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(15,23,42,0.025)',
                border: '1px dashed',
                borderColor: 'divider',
            }}
        >
            <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 1 }}
            >
                Écart |je suis − je veux|
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.4} useFlexGap alignItems="flex-start">
                <GapBlock
                    pillLabel="Auto"
                    gap={selfGap}
                    color="#1515B0"
                    interpretation={pickGapLabel(eRow.self, wRow.self)}
                    showInterpretations={showInterpretations}
                />
                {peerGaps.map((g, i) => (
                    <GapBlock
                        key={`gap-peer-${matrix.peer_columns[i]?.response_id ?? i}`}
                        pillLabel={matrix.peer_columns[i]?.label ?? `Pair ${i + 1}`}
                        gap={g}
                        color="#0EA5C9"
                        interpretation={pickGapLabel(eRow.peers[i] ?? null, wRow.peers[i] ?? null)}
                        showInterpretations={showInterpretations}
                    />
                ))}
                <GapBlock
                    pillLabel="Scientifique"
                    gap={sciGap}
                    color="#10b981"
                    interpretation={pickGapLabel(eRow.scientific, wRow.scientific)}
                    showInterpretations={showInterpretations}
                />
            </Stack>
        </Box>
    );
}

function DimensionCard({
    matrix,
    block,
    showInterpretations,
}: {
    matrix: ParticipantQuestionnaireMatrix;
    block: DimensionBlock;
    showInterpretations: boolean;
}) {
    return (
        <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 2, sm: 3 } }}>
            {block.name.length > 0 && (
                <>
                    <Typography
                        variant="overline"
                        color="primary.main"
                        fontWeight={800}
                        letterSpacing="0.1em"
                        sx={{ display: 'block', mb: 1 }}
                    >
                        Dimension analysée
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: 'text.primary' }}>
                        {block.name}
                    </Typography>
                </>
            )}

            <Stack spacing={2.5}>
                {block.pairs.map(pair => (
                    <Box
                        key={`pair-${pair.eRow.score_key}-${pair.wRow.score_key}`}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2.5,
                            p: 2,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Stack spacing={2}>
                            <RowBars matrix={matrix} row={pair.eRow} />
                            <RowBars matrix={matrix} row={pair.wRow} />
                        </Stack>
                        <GapPanel matrix={matrix} pair={pair} showInterpretations={showInterpretations} />
                    </Box>
                ))}

                {block.looseRows.map(row => (
                    <Box
                        key={`loose-${row.score_key}`}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2.5,
                            p: 2,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <RowBars matrix={matrix} row={row} />
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}

export function MatrixChartMode({ matrix, showInterpretations = true }: MatrixChartModeProps) {
    const blocks = buildDimensionBlocks(matrix);
    return (
        <Stack spacing={3}>
            {blocks.map(block => (
                <DimensionCard
                    key={block.name || 'noname'}
                    matrix={matrix}
                    block={block}
                    showInterpretations={showInterpretations}
                />
            ))}
        </Stack>
    );
}
