// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Typography } from '@mui/material';
import type * as React from 'react';

import { harmonizedCardSx } from './campaignDetailHarmonizedStyles';

export type HarmonizedKpiCardProps = {
    label: string;
    value: string | number;
    helper: string;
    icon: React.ElementType;
};

export function HarmonizedKpiCard({ label, value, helper, icon: Icon }: HarmonizedKpiCardProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                ...harmonizedCardSx,
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                '&:hover': {
                    boxShadow: theme => theme.palette.shadow.brandSubtle,
                    transform: 'translateY(-4px)',
                },
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    p: 2,
                    color: 'tint.primaryGhost',
                    pointerEvents: 'none',
                }}
                aria-hidden
            >
                <Icon size={72} strokeWidth={1.25} />
            </Box>
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        color: 'text.secondary',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 1,
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 800,
                        letterSpacing: -0.02,
                        lineHeight: 1.1,
                    }}
                >
                    {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.75, mt: 0.5 }}>
                    {helper}
                </Typography>
            </CardContent>
        </Card>
    );
}
