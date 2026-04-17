import type { QuestionnaireDetail } from '@aor/types';
import { Box, Paper, Slider, Typography, useTheme } from '@mui/material';

type DimensionCardsProps = {
    q: QuestionnaireDetail;
    values: Record<string, number>;
    onScoreChange: (scoreKey: string, value: number) => void;
};

function LikertRow({
    labelId,
    title,
    subtitle,
    value,
    onChange,
    variant,
}: {
    labelId: string;
    title: string;
    subtitle: string;
    value: number;
    onChange: (v: number) => void;
    variant: 'expressed' | 'desired';
}) {
    const theme = useTheme();
    const isDesired = variant === 'desired';
    const mainColor = isDesired ? theme.palette.secondary.main : theme.palette.primary.main;

    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.04em' }}>
                {title}
            </Typography>
            <Typography
                variant="caption"
                sx={{ display: 'block', color: 'text.disabled', mb: 0.5, fontSize: '0.7rem' }}
            >
                0 — 9
            </Typography>
            <Typography
                id={labelId}
                variant="body2"
                sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
                component="label"
            >
                {subtitle}
            </Typography>
            <Slider
                aria-labelledby={labelId}
                value={value}
                onChange={(_, v) => onChange(v as number)}
                min={0}
                max={9}
                step={1}
                valueLabelDisplay="auto"
                sx={{
                    mt: 0.5,
                    height: 8,
                    '& .MuiSlider-rail': {
                        opacity: 1,
                        bgcolor: isDesired ? 'rgba(245, 196, 0, 0.2)' : 'rgba(21, 21, 176, 0.1)',
                    },
                    '& .MuiSlider-track': {
                        bgcolor: mainColor,
                        border: 'none',
                    },
                    '& .MuiSlider-thumb': {
                        width: 20,
                        height: 20,
                        bgcolor: 'background.paper',
                        border: `3px solid ${mainColor}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0 0 0 6px ${isDesired ? 'rgba(245, 196, 0, 0.15)' : 'rgba(21, 21, 176, 0.15)'}`,
                        },
                    },
                }}
            />
        </Box>
    );
}

export function DimensionCards({ q, values, onScoreChange }: DimensionCardsProps) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2.5,
                alignItems: 'stretch',
            }}
        >
            {q.result_dims.map((dim, dimIndex) => (
                <Paper
                    key={`${dimIndex}-${dim.name}`}
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: 'secondary.main', // Jaune AOR
                            py: 1.5,
                            px: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 800,
                                color: 'secondary.contrastText',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontSize: '0.8rem',
                            }}
                        >
                            {dim.name}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 2.5, bgcolor: 'background.paper', flex: 1 }}>
                        {dim.scores.map((scoreKey, idx) => {
                            const key = String(scoreKey);
                            const variant = idx % 2 === 1 ? 'desired' : 'expressed';
                            const title = variant === 'expressed' ? 'Comportement EXPRIMÉ' : 'Comportement SOUHAITÉ';
                            return (
                                <LikertRow
                                    key={key}
                                    labelId={`likert-${key}`}
                                    title={title}
                                    subtitle={q.short_labels[scoreKey] ?? key}
                                    value={values[key] ?? 5}
                                    onChange={v => onScoreChange(key, v)}
                                    variant={variant}
                                />
                            );
                        })}
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', mt: 2, lineHeight: 1.6, fontSize: '0.8rem' }}
                        >
                            Ajustez chaque curseur pour refléter votre ressenti. Il n'y a pas de bonne ou mauvaise
                            réponse.
                        </Typography>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
}
