import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

export type RatingScaleEndpointLabels = {
    min?: string;
    max?: string;
};

type RatingScaleProps = {
    value: number | null;
    onChange: (value: number | null) => void;
    max?: number;
    min?: number;
    size?: 'small' | 'medium';
    /**
     * Libellés neutres sous l’échelle (text.secondary uniquement — jamais de code couleur
     * par extrémité pour éviter l’effet « mauvaise / bonne note »).
     */
    endpointLabels?: RatingScaleEndpointLabels;
    /**
     * Étiquette accessible décrivant l'item noté.
     * Ex. `"Comportement exprimé"` → `"Comportement exprimé : 5, échelle de 0 à 9"`.
     */
    ariaLabel?: string;
};

export const RatingScale = ({
    value,
    onChange,
    max = 9,
    min = 0,
    size = 'small',
    endpointLabels,
    ariaLabel,
}: RatingScaleProps) => (
    <Stack spacing={0.75}>
        <ToggleButtonGroup
            value={value}
            exclusive
            size={size}
            onChange={(_e, next) => {
                if (next !== null) onChange(next);
            }}
            aria-label={ariaLabel}
            sx={{ flexWrap: 'wrap', gap: 0.75 }}
        >
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(score => (
                <ToggleButton
                    key={`rating-${score}`}
                    value={score}
                    aria-label={
                        ariaLabel
                            ? `${ariaLabel} : ${score}, échelle de ${min} à ${max}`
                            : `${score}, échelle de ${min} à ${max}`
                    }
                    sx={{
                        minWidth: { xs: 40, sm: 38 },
                        height: { xs: 44, sm: 38 },
                        borderRadius: 2,
                        borderColor: 'surface.outlineVariant',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        fontWeight: 600,
                        transition:
                            'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                        '&:hover': {
                            bgcolor: 'surface.lavenderGrey',
                            borderColor: 'surface.outlineVariantSoft',
                        },
                        '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            borderColor: 'primary.main',
                            boxShadow: theme => theme.palette.shadow.brandSm,
                            transform: 'translateY(-1px)',
                            '&:hover': {
                                bgcolor: 'primary.main',
                            },
                        },
                    }}
                >
                    {score}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
        {endpointLabels?.min || endpointLabels?.max ? (
            <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ px: 0.25 }}>
                {endpointLabels.min ? (
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, maxWidth: '48%' }}>
                        {endpointLabels.min}
                    </Typography>
                ) : (
                    <span />
                )}
                {endpointLabels.max ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ lineHeight: 1.5, maxWidth: '48%', textAlign: 'right' }}
                    >
                        {endpointLabels.max}
                    </Typography>
                ) : null}
            </Stack>
        ) : null}
    </Stack>
);
