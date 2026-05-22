import type { Participant } from '@aor/types';

import { BaseStatusChip, type StatusChipTone } from './BaseStatusChip';

export type ParticipantActivityStatus = 'active' | 'invited' | 'new';

export function getParticipantActivityStatus(p: Participant): ParticipantActivityStatus {
    if (p.response_count > 0) return 'active';
    if (Object.keys(p.invite_status).length > 0) return 'invited';
    return 'new';
}

export type ParticipantStatusChipProps = {
    participant: Participant;
};

const PALETTE: Record<ParticipantActivityStatus, StatusChipTone> = {
    active: {
        label: 'Actif',
        bg: 'tint.successBg',
        color: 'tint.successText',
        dot: 'tint.successText',
        pulse: true,
    },
    invited: {
        label: 'Invité',
        bg: 'tint.secondaryBg',
        color: 'tint.secondaryText',
        dot: 'tint.secondaryText',
    },
    new: { label: 'Nouveau', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
};

export function ParticipantStatusChip({ participant }: ParticipantStatusChipProps) {
    const status = getParticipantActivityStatus(participant);
    const tone = PALETTE[status];

    return <BaseStatusChip {...tone} />;
}
