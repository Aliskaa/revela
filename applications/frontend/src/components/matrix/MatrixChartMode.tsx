import type { ParticipantQuestionnaireMatrix, ResultDim } from '@aor/types';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';

type MatrixChartModeProps = {
    matrix: ParticipantQuestionnaireMatrix;
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
}) {
    const { label, value, max, color = '#1515B0' } = props; // Bleu smalt par défaut
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
            <Typography variant="h6" fontWeight={800} sx={{ color, mt: 0.5, mb: 1 }} display="block">
                {value ?? '—'} <Typography component="span" variant="caption" color="text.disabled" />
            </Typography>
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

function RowBars({ matrix, rowKey }: { matrix: ParticipantQuestionnaireMatrix; rowKey: number }) {
    const row = matrix.rows.find(r => r.score_key === rowKey);
    if (!row) return null;

    return (
        <Box
            sx={{
                mt: 3,
                pb: 3,
                borderBottom: '1px dashed',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0, pb: 0 },
            }}
        >
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: 'text.primary' }}>
                {row.label}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={2} useFlexGap>
                {/* Bleu smalt */}
                <MiniBar label="Auto-évaluation" value={row.self} max={matrix.likert_max} color="#1515B0" />

                {/* Bleu azurin pour les pairs */}
                {row.peers.map((v, i) => (
                    <MiniBar
                        key={matrix.peer_columns[i]?.response_id ?? i}
                        label={matrix.peer_columns[i]?.label ?? `Pair ${i + 1}`}
                        value={v}
                        max={matrix.likert_max}
                        color="#83D8F5"
                    />
                ))}

                {/* Vert d'eau pour le scientifique */}
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

export function MatrixChartMode({ matrix }: MatrixChartModeProps) {
    const dims = matrix.result_dims as ResultDim[];

    if (dims.length > 0) {
        return (
            <Stack spacing={3}>
                {dims.map(dim => (
                    <Paper key={dim.name} variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 2, sm: 3 } }}>
                        <Typography
                            variant="overline"
                            color="primary.main"
                            fontWeight={800}
                            letterSpacing="0.1em"
                            sx={{ display: 'block', mb: 1 }}
                        >
                            Dimension analysée
                        </Typography>
                        <Typography variant="h5" fontWeight={800} sx={{ mb: 1, color: 'text.primary' }}>
                            {dim.name}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {dim.scores.map(sk => (
                                <RowBars key={sk} matrix={matrix} rowKey={sk} />
                            ))}
                        </Box>
                    </Paper>
                ))}
            </Stack>
        );
    }

    return (
        <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 2, sm: 3 } }}>
            {matrix.rows.map(row => (
                <RowBars key={row.score_key} matrix={matrix} rowKey={row.score_key} />
            ))}
        </Paper>
    );
}
