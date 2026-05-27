// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { TableRow } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Link } from '@tanstack/react-router';
import type * as React from 'react';

import { listRowSx } from '@/components/common/styles/listSurfaces';

export type ClickableTableRowProps = {
    to: string;
    /** Libellé pour lecteurs d'écran — ex. « Ouvrir Orange ». */
    ariaLabel: string;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

/**
 * Ligne de tableau entièrement cliquable vers une page détail.
 * Alternative à la colonne d'action sticky sur les écrans étroits (Mac 13").
 */
export function ClickableTableRow({ to, ariaLabel, children, sx }: ClickableTableRowProps) {
    return (
        <TableRow
            component={Link}
            to={to}
            hover
            aria-label={ariaLabel}
            sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
                ...listRowSx,
                ...sx,
            }}
        >
            {children}
        </TableRow>
    );
}
