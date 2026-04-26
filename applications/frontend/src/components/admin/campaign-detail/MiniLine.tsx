// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Stack, Typography } from '@mui/material';
import type { ElementType } from 'react';

export type MiniLineProps = {
    label: string;
    value: string;
    icon: ElementType;
};

export function MiniLine({ label, value, icon: Icon }: MiniLineProps) {
    return (
        <Stack direction="row" spacing={1.2} alignItems="start">
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 3,
                    bgcolor: 'tint.primaryBg',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                }}
            >
                <Icon size={15} />
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}
