import { ToggleButton, ToggleButtonGroup } from '@mui/material';

type RatingScaleProps = {
    value: number | null;
    onChange: (value: number | null) => void;
    max?: number;
    size?: 'small' | 'medium';
};

export const RatingScale = ({ value, onChange, max = 9, size = 'small' }: RatingScaleProps) => (
    <ToggleButtonGroup
        value={value}
        exclusive
        size={size}
        onChange={(_e, next) => { if (next !== null) onChange(next); }}
        sx={{ flexWrap: 'wrap', gap: 0.75 }}
    >
        {Array.from({ length: max }, (_, i) => (
            <ToggleButton
                key={i + 1}
                value={i + 1}
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
                {i + 1}
            </ToggleButton>
        ))}
    </ToggleButtonGroup>
);
