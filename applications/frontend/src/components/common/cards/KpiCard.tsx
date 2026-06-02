// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

const KPI_CARD_SX: SxProps<Theme> = {
    borderRadius: 2,
    boxShadow: theme => theme.palette.shadow.brandPaper,
    border: '1px solid',
    borderColor: 'tint.primaryBg',
    bgcolor: 'background.paper',
};

export type KpiCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    icon: React.ElementType;
    loading?: boolean;
};

export function KpiCard({ label, value, helper, icon: Icon, loading }: KpiCardProps) {
    const displayValue = loading ? '–' : value;

    return (
        <Card
            variant="outlined"
            sx={{
                ...KPI_CARD_SX,
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
                    transform: 'none',
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
                {loading ? (
                    <Skeleton variant="text" width={64} height={48} />
                ) : (
                    <Typography
                        variant="h3"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 800,
                            letterSpacing: -0.02,
                            lineHeight: 1.1,
                        }}
                    >
                        {displayValue}
                    </Typography>
                )}
                {helper ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.75, mt: 0.5 }}>
                        {helper}
                    </Typography>
                ) : null}
            </CardContent>
        </Card>
    );
}
