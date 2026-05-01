import { Chip } from '@mui/material';

import type { CampaignStatus } from '@aor/types';

export type CampaignStatusChipProps = {
    status: CampaignStatus;
};

const PALETTE: Record<CampaignStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Active', bg: 'tint.successBg', color: 'tint.successText' },
    closed: { label: 'Archivée', bg: 'tint.mutedBg', color: 'tint.mutedText' },
    archived: { label: 'Archivée', bg: 'tint.mutedBg', color: 'tint.mutedText' },
    draft: { label: 'Brouillon', bg: 'tint.secondaryBg', color: 'tint.secondaryText' },
};

export function CampaignStatusChip({ status }: CampaignStatusChipProps) {
    const tone = PALETTE[status] ?? PALETTE.draft;
    return <Chip label={tone.label} size="small" sx={{ borderRadius: 99, bgcolor: tone.bg, color: tone.color }} />;
}
