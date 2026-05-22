import { Box } from '@mui/material';
import type * as React from 'react';

import { HARMONIZED_LAVENDER_GREY } from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';

export type HarmonizedPaginationFooterProps = {
    children: React.ReactNode;
};

/** Pied de pagination harmonisé avec séparateur supérieur. */
export function HarmonizedPaginationFooter({ children }: HarmonizedPaginationFooterProps) {
    return <Box sx={{ borderTop: `1px solid ${HARMONIZED_LAVENDER_GREY}`, px: 2 }}>{children}</Box>;
}
