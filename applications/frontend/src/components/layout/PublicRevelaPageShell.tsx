// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Stack, Typography } from '@mui/material';
import { Sparkles } from 'lucide-react';
import type * as React from 'react';

import { FooterLayout } from '@/components/layout/FooterLayout';

export type PublicRevelaPageShellProps = {
    children: React.ReactNode;
};

/** Shell public Révéla : en-tête marque + contenu + pied de page (invite, confidentialité, etc.). */
export function PublicRevelaPageShell({ children }: PublicRevelaPageShellProps) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
            }}
        >
            <Box
                component="header"
                sx={{
                    px: { xs: 2, md: 4 },
                    py: 2,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'surface.outlineVariantFaint',
                }}
            >
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Sparkles size={18} strokeWidth={2} aria-hidden />
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            Plateforme
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2 }}>
                            Révéla
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Box>

            <FooterLayout />
        </Box>
    );
}
