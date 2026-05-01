import { Box, Card, CardContent, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import type * as React from 'react';

export type StatCardVariant = 'big' | 'compact' | 'mini';
export type StatCardTint = 'primary' | 'secondary';
export type StatCardFrame = 'card' | 'box';

export type StatCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    icon?: React.ElementType;
    loading?: boolean;
    /**
     * Si défini, affiche une LinearProgress en bas. Valeur entre 0 et 100.
     */
    progress?: number;
    /**
     * `big` (défaut) : valeur en h4, icône en pastille 42px — pour les KPI principaux.
     * `compact` : valeur en body2, icône en pastille 38px — pour les "info fields".
     * `mini` : valeur en body2, pas d'icône, encadré léger — pour les grilles mobiles denses.
     */
    variant?: StatCardVariant;
    tint?: StatCardTint;
    /**
     * Conteneur visuel. `card` (défaut) : MUI Card outlined. `box` : Box avec border simple,
     * utile dans des contextes où la Card outlined ferait trop "lourd" (ex. drawer participant).
     */
    frame?: StatCardFrame;
};

export function StatCard({
    label,
    value,
    helper,
    icon: Icon,
    loading,
    progress,
    variant = 'big',
    tint = 'primary',
    frame = 'card',
}: StatCardProps) {
    if (variant === 'mini') {
        return (
            <Box sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                    {value}
                </Typography>
            </Box>
        );
    }

    const iconBg = tint === 'primary' ? 'tint.primaryBg' : 'tint.secondaryBg';
    const iconColor = tint === 'primary' ? 'primary.main' : 'tint.secondaryText';
    const iconSize = variant === 'compact' ? 38 : 42;
    const iconGlyphSize = variant === 'compact' ? 16 : 18;

    const valueNode = loading ? (
        <Skeleton variant="text" width={48} height={variant === 'compact' ? 24 : 48} />
    ) : variant === 'compact' ? (
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
            {value}
        </Typography>
    ) : (
        <Typography
            variant="h4"
            fontWeight={800}
            color="text.primary"
            sx={{ mt: 0.4, letterSpacing: -0.5, lineHeight: 1.05 }}
        >
            {value}
        </Typography>
    );

    const inner = (
        <>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems={variant === 'compact' ? 'start' : 'end'}
                spacing={1.2}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant={variant === 'compact' ? 'caption' : 'body2'} color="text.secondary">
                        {label}
                    </Typography>
                    {valueNode}
                    {helper && variant !== 'compact' && (
                        <Typography variant="caption" color="text.secondary">
                            {helper}
                        </Typography>
                    )}
                </Box>
                {Icon ? (
                    <Box
                        sx={{
                            width: iconSize,
                            height: iconSize,
                            borderRadius: 3,
                            bgcolor: iconBg,
                            color: iconColor,
                            display: 'grid',
                            placeItems: 'center',
                            flex: 'none',
                        }}
                    >
                        <Icon size={iconGlyphSize} />
                    </Box>
                ) : null}
            </Stack>
            {typeof progress === 'number' ? (
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        mt: 2.2,
                        height: 8,
                        borderRadius: 99,
                        bgcolor: 'tint.subtleBg',
                        '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                    }}
                />
            ) : null}
        </>
    );

    if (frame === 'box') {
        return (
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: 4,
                    p: variant === 'compact' ? 1.8 : 2.5,
                }}
            >
                {inner}
            </Box>
        );
    }

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: variant === 'compact' ? 1.8 : 2.5 }}>{inner}</CardContent>
        </Card>
    );
}
