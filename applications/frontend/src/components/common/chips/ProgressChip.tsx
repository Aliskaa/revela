import type { CampaignParticipantProgress } from '@aor/types';

import { BaseStatusChip, type StatusChipTone } from './BaseStatusChip';

export type ProgressStatus = CampaignParticipantProgress['selfRatingStatus'];

export type ProgressChipProps = {
    status: ProgressStatus;
    /** Pill compact sans point — aligné sur les tableaux Stitch. */
    compact?: boolean;
};

const PALETTE: Record<ProgressStatus, StatusChipTone> = {
    completed: {
        label: 'Terminé',
        bg: 'tint.successBg',
        color: 'tint.successText',
        dot: 'tint.successText',
    },
    pending: {
        label: 'En cours',
        bg: 'tint.primaryBg',
        color: 'primary.main',
        dot: 'primary.main',
        pulse: true,
    },
    locked: { label: 'Verrouillé', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
};

export function ProgressChip({ status, compact = false }: ProgressChipProps) {
    const tone = PALETTE[status] ?? PALETTE.locked;

    return <BaseStatusChip {...tone} showDot={!compact} />;
}
