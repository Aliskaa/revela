import type { DiffPair } from '@aor/types';
import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface CalculationBlockProps {
    pair: DiffPair;
    scores: Record<string, number>;
    shortLabels: Record<string, string>;
}

export function CalculationBlock({ pair, scores, shortLabels }: CalculationBlockProps) {
    const theme = useTheme();

    // 1. Récupération des données
    const keyE = String(pair.e);
    const keyW = String(pair.w);
    const valE = scores[keyE] ?? 0;
    const valW = scores[keyW] ?? 0;
    const labelE = shortLabels[keyE] ?? `Score ${keyE}`;
    const labelW = shortLabels[keyW] ?? `Score ${keyW}`;

    // 2. Calculs
    const delta = valE - valW;
    const absoluteDelta = Number(Math.abs(delta).toFixed(2));
    const isOver = delta > 0;
    const isEqual = delta === 0;
    const message = isEqual
        ? `Pas d'écart entre ces deux aspects.`
        : isOver
          ? pair.if_e_gt
          : pair.if_w_gt;

    // 3. Couleurs du bloc d'écart harmonisées avec la charte AOR
    let bgColor, borderColor, chipColor;

    if (isEqual) {
        bgColor = 'rgba(34, 197, 94, 0.05)'; // Vert léger
        borderColor = 'rgba(34, 197, 94, 0.2)';
        chipColor = theme.palette.success.main;
    } else {
        bgColor = 'rgba(21, 21, 176, 0.04)'; // Bleu smalt léger
        borderColor = 'rgba(21, 21, 176, 0.15)';
        chipColor = theme.palette.primary.main;
    }

    const renderIcon = () => {
        if (isEqual) return <Minus size={18} />;
        return isOver ? <TrendingUp size={18} /> : <TrendingDown size={18} />;
    };

    // Sous-composant pour les barres (Exprimé = Bleu, Souhaité = Jaune)
    const renderScoreBar = (label: string, value: number, color: string) => (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                <Typography
                    variant="body2"
                    color="text.primary"
                    fontWeight={800}
                    textTransform="uppercase"
                    letterSpacing={0.5}
                >
                    {label}
                </Typography>
                <Typography variant="body1" fontWeight={900} sx={{ color }}>
                    {value}{' '}
                    <Typography component="span" variant="caption" color="text.disabled" fontWeight={600}></Typography>
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={(value / 9) * 100}
                sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
                }}
            />
        </Box>
    );

    return (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: 3, borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 }, pb: { xs: 2.5, sm: 4 } + ' !important' }}>
                {/* Grille robuste sans dépendre des versions de Grid Material-UI */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
                        gap: { xs: 3, md: 5 },
                        alignItems: 'center',
                    }}
                >
                    {/* MOITIÉ GAUCHE : Les barres de progression */}
                    <Box>
                        {renderScoreBar(labelE, valE, theme.palette.primary.main)}
                        {renderScoreBar(labelW, valW, theme.palette.secondary.main)}
                    </Box>

                    {/* MOITIÉ DROITE : Le bloc d'écart */}
                    <Stack
                        alignItems="flex-start"
                        justifyContent="center"
                        sx={{
                            p: 3,
                            bgcolor: bgColor,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: borderColor,
                            height: '100%',
                            minHeight: 140,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Chip
                                icon={renderIcon()}
                                label={`Écart : ${absoluteDelta}`}
                                sx={{
                                    bgcolor: chipColor,
                                    color: 'white',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    py: 2,
                                    px: 0.5,
                                    borderRadius: 2,
                                    '& .MuiChip-icon': { color: 'white' },
                                }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.primary" fontWeight={500} sx={{ lineHeight: 1.6 }}>
                            {message}
                        </Typography>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
}
