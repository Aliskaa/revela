import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type * as React from 'react';

export type EmptyStateVariant = 'primary' | 'secondary' | 'muted';

export type EmptyStateProps = {
    /** Icône lucide (ou autre composant `LucideIcon`-like). */
    icon?: React.ElementType;
    title: string;
    description?: string;
    /** CTA optionnel rendu sous le texte (Button, Stack de boutons…). */
    action?: React.ReactNode;
    /**
     * Tonalité chromatique de la pastille d'icône.
     *  - `primary` (défaut) : bleu brand. Pour les "rien d'attribué encore" neutres.
     *  - `secondary`        : jaune brand. Pour les états "en attente d'action externe".
     *  - `muted`            : gris. Pour les filtres sans résultat / search vide.
     */
    variant?: EmptyStateVariant;
    /**
     * Si `false`, n'enrobe pas dans un `<Card>` — utile quand l'EmptyState est déjà
     * imbriqué dans une Card (ex. table cellule ou bandeau intra-card).
     */
    boxed?: boolean;
};

const variantSx: Record<EmptyStateVariant, { bgcolor: string; color: string }> = {
    primary: { bgcolor: 'tint.primaryBg', color: 'primary.main' },
    secondary: { bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' },
    muted: { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' },
};

/**
 * État vide réutilisable : pastille d'icône + titre + description + CTA optionnel.
 * Avant cette factorisation, le pattern était dupliqué (avec ou sans icône, parfois
 * juste un `<Typography variant="h6">Aucun X pour le moment</Typography>`).
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = 'primary',
    boxed = true,
}: EmptyStateProps) {
    const inner = (
        <Stack spacing={2} alignItems="start">
            {Icon ? (
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        display: 'grid',
                        placeItems: 'center',
                        ...variantSx[variant],
                    }}
                >
                    <Icon size={20} />
                </Box>
            ) : null}
            <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                    {title}
                </Typography>
                {description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                        {description}
                    </Typography>
                ) : null}
            </Box>
            {action ? <Box sx={{ mt: 0.5 }}>{action}</Box> : null}
        </Stack>
    );

    if (!boxed) return inner;

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>{inner}</CardContent>
        </Card>
    );
}
