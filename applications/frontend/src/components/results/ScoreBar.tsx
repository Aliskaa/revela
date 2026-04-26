// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { LinearProgress, Stack, Typography } from '@mui/material';

export type ScoreBarProps = {
    value: number | null;
    max: number;
    color: string;
};

export function ScoreBar({ value, max, color }: ScoreBarProps) {
    const pct = value !== null ? Math.round((value / max) * 100) : 0;
    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ minWidth: 24, textAlign: 'right' }}>
                {value ?? '–'}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 99,
                    bgcolor: 'tint.subtleBg',
                    '& .MuiLinearProgress-bar': { bgcolor: color },
                }}
            />
        </Stack>
    );
}
