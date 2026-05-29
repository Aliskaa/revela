// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';

export type QuestionnaireProgressProps = {
    filled: number;
    total: number;
    label?: string;
    ariaLabel?: string;
};

/**
 * Barre de progression large d'un questionnaire (desktop + mobile). Remplace les KPI
 * sur les pages de saisie : la progression devient l'élément central, sans bruit.
 */
export function QuestionnaireProgress({
    filled,
    total,
    label = 'Progression',
    ariaLabel = 'Progression du questionnaire',
}: QuestionnaireProgressProps) {
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

    return (
        <Box sx={{ ...surfaceCardSx, p: { xs: 2, md: 2.5 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                    {filled} / {total}
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {pct}%
                    </Typography>
                </Typography>
            </Stack>
            <LinearProgress
                variant="determinate"
                value={pct}
                aria-label={ariaLabel}
                sx={{
                    height: 10,
                    borderRadius: 99,
                    bgcolor: 'tint.subtleBg',
                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 99 },
                }}
            />
        </Box>
    );
}
