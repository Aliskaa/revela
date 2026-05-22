import { Box } from '@mui/material';
import type * as React from 'react';

import { LAVENDER_GREY } from '@/components/common/styles/listSurfaces';

export type TablePaginationFooterProps = {
    children: React.ReactNode;
};

/** Pied de pagination harmonisé avec séparateur supérieur. */
export function TablePaginationFooter({ children }: TablePaginationFooterProps) {
    return <Box sx={{ borderTop: `1px solid ${LAVENDER_GREY}`, px: 2 }}>{children}</Box>;
}
