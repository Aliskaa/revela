import { Box, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import type * as React from 'react';

export function StatCard({
    label,
    value,
    helper,
    icon: Icon,
    loading,
}: {
    label: string;
    value: string | number;
    helper?: string;
    icon: React.ElementType;
    loading?: boolean;
}) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="end">
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            {label}
                        </Typography>
                        {loading ? (
                            <Skeleton variant="text" width={48} height={48} />
                        ) : (
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="text.primary"
                                sx={{ mt: 0.4, letterSpacing: -0.5 }}
                            >
                                {value}
                            </Typography>
                        )}
                        {helper && (
                            <Typography variant="caption" color="text.secondary">
                                {helper}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 3,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <Icon size={18} />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
