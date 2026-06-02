// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

export type StickyActionTableScrollProps = {
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

/**
 * Conteneur de scroll horizontal pour tables avec colonne d'action sticky.
 * À utiliser autour du `<Table>` uniquement — la pagination reste en dehors.
 */
export function StickyActionTableScroll({ children, sx }: StickyActionTableScrollProps) {
    return (
        <Box
            sx={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                ...sx,
            }}
        >
            {children}
        </Box>
    );
}
