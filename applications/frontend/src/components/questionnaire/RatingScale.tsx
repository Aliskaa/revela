import { ToggleButton, ToggleButtonGroup } from '@mui/material';

type RatingScaleProps = {
    value: number | null;
    onChange: (value: number | null) => void;
    max?: number;
    min?: number;
    size?: 'small' | 'medium';
    /**
     * Étiquette accessible décrivant l'item noté (sera lue par les lecteurs d'écran avant la valeur).
     * Ex. `"Comportement exprimé"` → annoncera `"Comportement exprimé : 5 sur 9"`.
     */
    ariaLabel?: string;
};

export const RatingScale = ({ value, onChange, max = 9, min = 1, size = 'small', ariaLabel }: RatingScaleProps) => (
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
                aria-label={ariaLabel ? `${ariaLabel} : ${score} sur ${max}` : `${score} sur ${max}`}
                sx={{
                    minWidth: 38,
                    height: 38,
                    borderRadius: 2,
                    borderColor: 'rgba(15,23,42,0.12)',
                    color: 'text.primary',
                    '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff' },
                    '&.Mui-selected:hover': { bgcolor: 'primary.dark' },
                }}
            >
                {score}
            </ToggleButton>
        ))}
    </ToggleButtonGroup>
);
