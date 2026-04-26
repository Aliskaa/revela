// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';

import type { Metric } from '@/lib/participant/dashboardView';

export type MetricCardProps = {
    metric: Metric;
    progress: number;
};

export function MetricCard({ metric, progress }: MetricCardProps) {
    const Icon = metric.icon;
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.4 }}>
                <Typography variant="body2" color="text.secondary">
                    {metric.label}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mt: 1 }}>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            color="text.primary"
                            lineHeight={1.05}
                            sx={{ letterSpacing: -0.5 }}
                        >
                            {metric.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {metric.helper}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 3,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <Icon size={18} />
                    </Box>
                </Stack>
                {metric.label === 'Progression' ? (
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            mt: 2.2,
                            height: 8,
                            borderRadius: 99,
                            bgcolor: 'tint.subtleBg',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                    />
                ) : null}
            </CardContent>
        </Card>
    );
}
