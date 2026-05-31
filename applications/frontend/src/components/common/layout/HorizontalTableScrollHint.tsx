// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

export type HorizontalTableScrollHintProps = {
    children: React.ReactNode;
    hint?: string;
    sx?: SxProps<Theme>;
    containerSx?: SxProps<Theme>;
};

const DEFAULT_HINT = 'Faites défiler horizontalement pour voir toutes les colonnes.';

/** Zone scrollable horizontale avec courte indication pour les tableaux larges (matrices). */
export function HorizontalTableScrollHint({
    children,
    hint = DEFAULT_HINT,
    sx,
    containerSx,
}: HorizontalTableScrollHintProps) {
    return (
        <Box sx={sx}>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, lineHeight: 1.5, fontStyle: 'italic' }}
            >
                {hint}
            </Typography>
            <Box
                sx={{
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    ...containerSx,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
