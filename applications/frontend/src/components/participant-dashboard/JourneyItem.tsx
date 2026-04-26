// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Chip, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

import type { JourneyStep } from '@/lib/participant/dashboardView';

export type JourneyItemProps = {
    step: JourneyStep;
};

export function JourneyItem({ step }: JourneyItemProps) {
    const Icon = step.icon;
    const clickable = step.state !== 'locked' && Boolean(step.to);
    const chipLabel = step.state === 'completed' ? 'Terminé' : step.state === 'current' ? 'En cours' : 'Verrouillé';
    const chipSx =
        step.state === 'completed'
            ? { bgcolor: 'tint.successBg', color: 'tint.successText' }
            : step.state === 'current'
              ? { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }
              : { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' };

    const content = (
        <Stack
            spacing={1.2}
            sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border',
                borderRadius: 4,
                bgcolor: 'background.paper',
                cursor: clickable ? 'pointer' : 'default',
                opacity: step.state === 'locked' ? 0.6 : 1,
                transition: 'all 0.15s ease',
                ...(clickable
                    ? { '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(15,24,152,0.08)' } }
                    : {}),
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="start">
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 4,
                        display: 'grid',
                        placeItems: 'center',
                        ...(step.state === 'completed'
                            ? { bgcolor: 'rgba(16,185,129,0.10)', color: 'rgb(4,120,87)' }
                            : step.state === 'current'
                              ? { bgcolor: 'rgba(255,204,0,0.14)', color: 'rgb(180,120,0)' }
                              : { bgcolor: 'rgba(148,163,184,0.12)', color: 'rgb(100,116,139)' }),
                    }}
                >
                    <Icon size={18} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                    >
                        <Typography fontWeight={600} color="text.primary">
                            {step.label}
                        </Typography>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                            <Chip label={chipLabel} size="small" sx={{ borderRadius: 99, ...chipSx }} />
                            {clickable && <ChevronRight size={16} style={{ color: 'primary.main' }} />}
                        </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                        {step.description}
                    </Typography>
                </Box>
            </Stack>
        </Stack>
    );

    if (clickable && step.to) {
        return (
            <Link to={step.to} style={{ textDecoration: 'none' }}>
                {content}
            </Link>
        );
    }
    return content;
}
