import { Chip } from '@mui/material';

import type { Participant } from '@aor/types';

export type ParticipantActivityStatus = 'active' | 'invited' | 'new';

export function getParticipantActivityStatus(p: Participant): ParticipantActivityStatus {
    if (p.response_count > 0) return 'active';
    if (Object.keys(p.invite_status).length > 0) return 'invited';
    return 'new';
}

export type ParticipantStatusChipProps = {
    participant: Participant;
};

export function ParticipantStatusChip({ participant }: ParticipantStatusChipProps) {
    const status = getParticipantActivityStatus(participant);
    if (status === 'active') {
        return (
            <Chip
                label="Actif"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText' }}
            />
        );
    }
    if (status === 'invited') {
        return (
            <Chip
                label="Invité"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }}
            />
        );
    }
    return (
        <Chip
            label="Nouveau"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }}
        />
    );
}
