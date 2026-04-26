// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
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
            sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
        />
    );
}
