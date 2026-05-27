import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

export type TablePaginationFooterProps = {
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

/** Pied de pagination harmonisé avec séparateur supérieur. */
export function TablePaginationFooter({ children, sx }: TablePaginationFooterProps) {
    return (
        <Box sx={{ borderTop: '1px solid', borderColor: 'surface.lavenderGrey', px: 2, ...sx }}>{children}</Box>
    );
}
