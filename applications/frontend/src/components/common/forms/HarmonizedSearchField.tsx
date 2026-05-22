import { InputAdornment, TextField } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Search } from 'lucide-react';

import { HARMONIZED_LAVENDER_GREY } from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';

export type HarmonizedSearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    sx?: SxProps<Theme>;
};

/** Champ de recherche harmonisé (fond lavande, icône loupe, sans bordure au repos). */
export function HarmonizedSearchField({
    value,
    onChange,
    placeholder = 'Rechercher…',
    sx,
}: HarmonizedSearchFieldProps) {
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
                            <Search size={18} color="rgba(107, 114, 128, 0.7)" />
                        </InputAdornment>
                    ),
                },
            }}
            sx={{
                width: { xs: '100%', sm: 320 },
                '& .MuiOutlinedInput-root': {
                    bgcolor: HARMONIZED_LAVENDER_GREY,
                    borderRadius: 3,
                    py: 0.75,
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': {
                        border: '2px solid rgba(15, 24, 152, 0.2)',
                    },
                },
                ...sx,
            }}
        />
    );
}
