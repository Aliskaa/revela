import { InputAdornment, TextField, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Search } from 'lucide-react';

export type SearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    sx?: SxProps<Theme>;
};

/** Champ de recherche (fond lavande, icône loupe, sans bordure au repos). */
export function SearchField({ value, onChange, placeholder = 'Rechercher…', sx }: SearchFieldProps) {
    const theme = useTheme();

    return (
        <TextField
            size="small"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search size={18} color={theme.palette.tint.iconMuted} />
                        </InputAdornment>
                    ),
                },
            }}
            sx={{
                width: { xs: '100%', sm: 320 },
                '& .MuiOutlinedInput-root': {
                    bgcolor: 'surface.lavenderGrey',
                    borderRadius: 3,
                    py: 0.75,
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': {
                        border: '2px solid',
                        borderColor: 'tint.primaryFocusRing',
                    },
                },
                ...sx,
            }}
        />
    );
}
