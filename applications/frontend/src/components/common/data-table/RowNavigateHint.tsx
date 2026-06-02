// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { ChevronRight } from 'lucide-react';

export type RowNavigateHintProps = {
    sx?: SxProps<Theme>;
};

/** Chevron discret en fin de ligne cliquable — renforce l'affordance sans colonne dédiée. */
export function RowNavigateHint({ sx }: RowNavigateHintProps) {
    return (
        <Box
            component="span"
            aria-hidden
            sx={{
                display: 'inline-flex',
                color: 'primary.main',
                opacity: 0.45,
                flexShrink: 0,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                '.MuiTableRow-root:hover &': {
                    opacity: 1,
                    transform: 'translateX(4px)',
                },
                ...sx,
            }}
        >
            <ChevronRight size={18} />
        </Box>
    );
}
