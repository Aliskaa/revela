import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type * as React from 'react';

export type PageHeroCardProps = {
    /** Petit chip d'identification au-dessus du titre. */
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Bouton(s) d'action à droite, généralement un CTA "Nouvelle X". */
    actions?: React.ReactNode;
};

/**
 * Carte d'en-tête utilisée en haut de chaque page admin/coach : eyebrow + titre + sous-titre + CTA.
 * Avant cette factorisation, la même structure était copiée-collée dans 8 routes différentes.
 */
export function PageHeroCard({ eyebrow, title, subtitle, actions }: PageHeroCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack
                    spacing={2.5}
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'start', lg: 'start' }}
                >
                    <Box>
                        {eyebrow ? (
                            <Chip
                                label={eyebrow}
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                        ) : null}
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                    {actions ? (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            {actions}
                        </Stack>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}
