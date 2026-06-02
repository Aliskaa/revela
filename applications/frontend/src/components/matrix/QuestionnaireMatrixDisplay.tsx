// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
import type { SxProps, Theme } from '@mui/material';
import { BarChart3, Table2 } from 'lucide-react';
import { useState } from 'react';

import { MatrixChartMode } from './MatrixChartMode';
import { MatrixTableMode } from './MatrixTableMode';

type QuestionnaireMatrixDisplayProps = {
    matrix: ParticipantQuestionnaireMatrix;
};

const toggleGroupSx = {
    bgcolor: 'surface.lavenderGrey',
    p: 0.5,
    borderRadius: 2,
    gap: 0.5,
} as const;

const toggleButtonSx: SxProps<Theme> = {
    px: 2,
    py: 0.75,
    border: 'none',
    borderRadius: 1.5,
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: 'text.secondary',
    '&.Mui-selected': {
        bgcolor: 'background.paper',
        color: 'primary.main',
        boxShadow: theme => theme.palette.shadow.brandPaper,
    },
    '&.Mui-selected:hover': {
        bgcolor: 'background.paper',
    },
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
                sx={{ mb: 3 }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                        label={`${matrix.peer_columns.length} retour(s) pair(s)`}
                        size="small"
                        variant="outlined"
                        sx={{
                            fontWeight: 600,
                            borderColor: 'surface.outlineVariant',
                            color: 'text.secondary',
                        }}
                    />
                </Box>

                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
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
                        sx={toggleGroupSx}
                    >
                        <ToggleButton value="table" aria-label="Tableau" sx={toggleButtonSx}>
                            <Table2 size={16} style={{ marginRight: 8 }} />
                            Tableau
                        </ToggleButton>
                        <ToggleButton value="chart" aria-label="Graphique" sx={toggleButtonSx}>
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
