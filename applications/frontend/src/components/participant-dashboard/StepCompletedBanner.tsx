// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Lock } from 'lucide-react';

export type StepCompletedBannerProps = {
    title: string;
    description?: string;
    backTo?: '/journey' | '/campaigns' | '/';
    backLabel?: string;
};

export function StepCompletedBanner({
    title,
    description,
    backTo = '/journey',
    backLabel = 'Retour au parcours',
}: StepCompletedBannerProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="start">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 4,
                            bgcolor: 'tint.successBg',
                            color: 'tint.successText',
                            display: 'grid',
                            placeItems: 'center',
                            flex: 'none',
                        }}
                    >
                        <Lock size={20} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                            {description ??
                                "Cette étape a été soumise. Pour préserver l'intégrité de votre parcours, elle ne peut plus être modifiée."}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2 }}>
                            <Button
                                component={Link}
                                to={backTo}
                                variant="contained"
                                disableElevation
                                endIcon={<ArrowRight size={14} />}
                                sx={{ borderRadius: 3 }}
                            >
                                {backLabel}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
