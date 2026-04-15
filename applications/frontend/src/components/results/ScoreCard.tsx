import type { ResultDim } from '@/api/types';
import { Box, Card, CardContent, LinearProgress, Typography, useTheme } from '@mui/material';

interface ScoreCardProps {
    dim: ResultDim;
    scores: Record<string, number>;
    shortLabels: Record<string, string>;
    maxScore?: number; // Ajouté pour éviter le nombre codé en dur (magic number)
}

export function ScoreCard({
    dim,
    scores,
    shortLabels,
    maxScore = 9, // Valeur par défaut fixée à 9 pour conserver ta logique initiale
}: ScoreCardProps) {
    const theme = useTheme();
    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                borderRadius: 3,
                borderColor: 'divider',
                boxShadow: 'none',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        mb: 3,
                    }}
                >
                    {dim.name}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {dim.scores.map(key => {
                        const stringKey = String(key);
                        const value = scores[stringKey] ?? 0;
                        const label = shortLabels[stringKey] ?? `Score ${key}`;

                        // Note : Envisage d'utiliser une couleur du thème (ex: 'primary.dark')
                        // plutôt qu'un code hexadécimal si tu prévois un mode sombre plus tard.
                        const barColor = theme.palette.primary.main;

                        // Calcul du pourcentage sécurisé pour éviter la division par zéro
                        const percentage = maxScore > 0 ? (value / maxScore) * 100 : 0;

                        return (
                            <Box key={key}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-end',
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        id={`label-${key}`} // Ajouté pour l'accessibilité
                                        variant="body2"
                                        color="text.primary"
                                        fontWeight={600}
                                    >
                                        {label}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={800} sx={{ color: barColor }}>
                                        {value}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={percentage}
                                    aria-labelledby={`label-${key}`} // Lie visuellement la barre à son étiquette textuelle
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'action.hover',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: barColor,
                                            borderRadius: 4,
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </CardContent>
        </Card>
    );
}
