import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import {
    Box,
    Checkbox,
    Chip,
    FormControlLabel,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { BarChart3, Table2 } from 'lucide-react';
import { useState } from 'react';
import { MatrixChartMode } from './MatrixChartMode';
import { MatrixTableMode } from './MatrixTableMode';

type QuestionnaireMatrixDisplayProps = {
    matrix: ParticipantQuestionnaireMatrix;
};

export const QuestionnaireMatrixDisplay = ({ matrix }: QuestionnaireMatrixDisplayProps) => {
    const [mode, setMode] = useState<'table' | 'chart'>('table');
    const [showInterpretations, setShowInterpretations] = useState(true);

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
                    <Chip
                        label={`${matrix.peer_columns.length} retour(s) pair(s)`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Box>

                <Stack direction="row" alignItems="center" spacing={2}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={showInterpretations}
                                onChange={e => setShowInterpretations(e.target.checked)}
                            />
                        }
                        label={
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                Afficher les interprétations
                            </Typography>
                        }
                    />
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
            </Stack>

            {mode === 'table' ? (
                <MatrixTableMode matrix={matrix} showInterpretations={showInterpretations} />
            ) : (
                <MatrixChartMode matrix={matrix} showInterpretations={showInterpretations} />
            )}
        </Box>
    );
};
