// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Chip } from '@mui/material';

import type { CampaignStatus } from '@aor/types';

export type StatusChipProps = {
    status: CampaignStatus;
};

export function StatusChip({ status }: StatusChipProps) {
    if (status === 'active') {
        return (
            <Chip
                label="Active"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
            />
        );
    }
    if (status === 'closed' || status === 'archived') {
        return (
            <Chip
                label="Archivée"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
            />
        );
    }
    return (
        <Chip
            label="Brouillon"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'rgba(255,204,0,0.16)', color: 'rgb(180,120,0)' }}
        />
    );
}
