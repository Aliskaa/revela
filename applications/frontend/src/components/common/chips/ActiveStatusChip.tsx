import { Chip } from '@mui/material';

export type ActiveStatusChipProps = {
    isActive: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
};

export function ActiveStatusChip({
    isActive,
    activeLabel = 'Actif',
    inactiveLabel = 'Inactif',
}: ActiveStatusChipProps) {
    if (isActive) {
        return (
            <Chip
                label={activeLabel}
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText' }}
            />
        );
    }
    return (
        <Chip
            label={inactiveLabel}
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }}
        />
    );
}
