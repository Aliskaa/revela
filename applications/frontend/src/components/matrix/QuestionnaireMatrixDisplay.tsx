import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { Box, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { BarChart3, Info, Table2 } from 'lucide-react';
import { useState } from 'react';
import { MatrixChartMode } from './MatrixChartMode';
import { MatrixTableMode } from './MatrixTableMode';

type QuestionnaireMatrixDisplayProps = {
    matrix: ParticipantQuestionnaireMatrix;
};

export const QuestionnaireMatrixDisplay = ({ matrix }: QuestionnaireMatrixDisplayProps) => {
    const [mode, setMode] = useState<'table' | 'chart'>('table');

    return (
        <Box>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Info size={18} className="text-secondary" color="#6b7280" />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Auto-évaluation (Rép. #{matrix.self_response_id ?? '—'})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        •
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Analyse Scientifique (#{matrix.scientific_response_id ?? '—'})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        •
                    </Typography>
                    <Chip
                        label={`${matrix.peer_columns.length} retour(s) pair(s)`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Box>

                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={(_, v: 'table' | 'chart' | null) => {
                        if (v) setMode(v);
                    }}
                    size="small"
                    aria-label="Mode d'affichage"
                    sx={{ bgcolor: 'background.default', p: 0.5, borderRadius: 2 }}
                >
                    <ToggleButton
                        value="table"
                        aria-label="Tableau"
                        sx={{
                            px: 2,
                            border: 'none',
                            borderRadius: 1.5,
                            '&.Mui-selected': { bgcolor: 'background.paper', boxShadow: 1 },
                        }}
                    >
                        <Table2 size={16} style={{ marginRight: 8 }} />
                        Tableau
                    </ToggleButton>
                    <ToggleButton
                        value="chart"
                        aria-label="Graphique"
                        sx={{
                            px: 2,
                            border: 'none',
                            borderRadius: 1.5,
                            '&.Mui-selected': { bgcolor: 'background.paper', boxShadow: 1 },
                        }}
                    >
                        <BarChart3 size={16} style={{ marginRight: 8 }} />
                        Graphique
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            {mode === 'table' ? <MatrixTableMode matrix={matrix} /> : <MatrixChartMode matrix={matrix} />}
        </Box>
    );
};
