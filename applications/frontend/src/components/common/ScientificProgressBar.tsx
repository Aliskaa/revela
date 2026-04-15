import { Box, useTheme } from '@mui/material';

/** Barre de progression bi-tons (bleu → jaune) pour le test scientifique. */
export function ScientificProgressBar({ valuePct }: { valuePct: number }) {
    const theme = useTheme();
    const v = Math.min(100, Math.max(0, valuePct));

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 560,
                mx: 'auto',
                height: 12,
                borderRadius: 6,
                bgcolor: 'rgba(21, 21, 176, 0.1)',
                overflow: 'hidden',
                mb: 3,
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    width: `${v}%`,
                    borderRadius: 6,
                    // Dégradé dynamique du Bleu smalt (primary) au Jaune (secondary)
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 42%, ${theme.palette.secondary.main} 88%, ${theme.palette.secondary.light} 100%)`,
                    transition: 'width 0.25s ease-out',
                }}
            />
        </Box>
    );
}
