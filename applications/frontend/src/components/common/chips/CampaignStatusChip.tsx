import type { CampaignStatus } from '@aor/types';

import { BaseStatusChip, type StatusChipTone } from './BaseStatusChip';

export type CampaignStatusChipProps = {
    status: CampaignStatus;
};

const PALETTE: Record<CampaignStatus, StatusChipTone> = {
    active: {
        label: 'Active',
        bg: 'tint.successBg',
        color: 'tint.successText',
        dot: 'tint.successText',
        pulse: true,
    },
    closed: { label: 'Archivée', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
    archived: { label: 'Archivée', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
    draft: { label: 'Brouillon', bg: 'tint.secondaryBg', color: 'tint.secondaryText', dot: 'tint.secondaryText' },
};

export function CampaignStatusChip({ status }: CampaignStatusChipProps) {
    const tone = PALETTE[status] ?? PALETTE.draft;
    return <BaseStatusChip {...tone} />;
}
