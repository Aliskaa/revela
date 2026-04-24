import { Box, Stack, Typography } from '@mui/material';
import type * as React from 'react';

export function SectionTitle({
    title,
    subtitle,
    action,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <Stack direction="row" alignItems="start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
            {action}
        </Stack>
    );
}
