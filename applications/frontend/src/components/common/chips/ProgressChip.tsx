import { Chip } from '@mui/material';

import type { CampaignParticipantProgress } from '@aor/types';

export type ProgressStatus = CampaignParticipantProgress['selfRatingStatus'];

export type ProgressChipProps = {
    status: ProgressStatus;
};

export function ProgressChip({ status }: ProgressChipProps) {
    if (status === 'completed') {
        return (
            <Chip
                label="Terminé"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText' }}
            />
        );
    }
    if (status === 'pending') {
        return (
            <Chip
                label="En cours"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }}
            />
        );
    }
    return (
        <Chip
            label="Verrouillé"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }}
        />
    );
}
