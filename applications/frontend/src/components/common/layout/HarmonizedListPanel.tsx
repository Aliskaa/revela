import { Box, Card, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

import {
    HARMONIZED_LAVENDER_GREY,
    harmonizedListPanelSx,
} from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';

export type HarmonizedListPanelProps = {
    title: string;
    subtitle?: string;
    headerActions?: React.ReactNode;
    headerBorder?: boolean;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
};

/** Panneau de liste admin harmonisé : carte avec en-tête titre + actions (recherche, pagination). */
export function HarmonizedListPanel({
    title,
    subtitle,
    headerActions,
    headerBorder = false,
    children,
    sx,
}: HarmonizedListPanelProps) {
    return (
        <Card variant="outlined" sx={{ ...harmonizedListPanelSx, ...sx }}>
            <Box
                sx={{
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 3, md: 4 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 3,
                    ...(headerBorder ? { borderBottom: `1px solid ${HARMONIZED_LAVENDER_GREY}` } : {}),
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mb: subtitle ? 0.5 : 0 }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                {headerActions ? (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        {headerActions}
                    </Stack>
                ) : null}
            </Box>
            {children}
        </Card>
    );
}
