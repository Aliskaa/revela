import { Box, ButtonBase, Typography } from '@mui/material';

interface ScaleInputProps {
    value: number | null;
    onChange: (value: number) => void;
    labels?: [string, string];
}

const SCALE_LABELS: Record<number, string> = {
    0: 'Pas du tout',
    1: 'Très peu',
    2: 'Peu',
    3: 'Assez',
    4: 'Beaucoup',
    5: 'Totalement',
};

export function ScaleInput({ value, onChange, labels = ["Pas d'accord", "D'accord"] }: ScaleInputProps) {
    return (
        <Box>
            {/* Légende */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {labels[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {labels[1]}
                </Typography>
            </Box>

            {/* Boutons 0-5 */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, justifyContent: 'center' }}>
                {[0, 1, 2, 3, 4, 5].map(v => {
                    const selected = value === v;
                    return (
                        <ButtonBase
                            key={v}
                            onClick={() => onChange(v)}
                            sx={{
                                width: { xs: 42, sm: 52 },
                                height: { xs: 42, sm: 52 },
                                borderRadius: '50%',
                                border: '2px solid',
                                borderColor: selected ? 'primary.main' : 'divider',
                                bgcolor: selected ? 'primary.main' : 'background.paper',
                                color: selected ? 'white' : 'text.primary',
                                fontWeight: 700,
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                transition: 'all 0.12s',
                                flexDirection: 'column',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: selected ? 'primary.dark' : 'primary.50',
                                    transform: 'scale(1.08)',
                                },
                            }}
                            title={SCALE_LABELS[v]}
                        >
                            {v}
                        </ButtonBase>
                    );
                })}
            </Box>
        </Box>
    );
}
