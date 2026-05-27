import { Box, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

export type ResponsiveListViewsProps = {
    desktop: React.ReactNode;
    mobile: React.ReactNode;
    mobileSx?: SxProps<Theme>;
    /**
     * Scroll horizontal global du bloc desktop. Désactiver quand le desktop gère lui-même
     * le scroll via `StickyActionTableScroll` (colonne d'action sticky).
     */
    desktopScroll?: boolean;
};

/** Affiche un tableau desktop (lg+) et des cartes empilées sur mobile. */
export function ResponsiveListViews({
    desktop,
    mobile,
    mobileSx,
    desktopScroll = true,
}: ResponsiveListViewsProps) {
    return (
        <>
            <Box
                sx={{
                    display: { xs: 'none', lg: 'block' },
                    ...(desktopScroll ? { overflowX: 'auto' } : {}),
                }}
            >
                {desktop}
            </Box>
            <Stack
                spacing={2}
                sx={{
                    display: { xs: 'flex', lg: 'none' },
                    p: 2.5,
                    ...mobileSx,
                }}
            >
                {mobile}
            </Stack>
        </>
    );
}
