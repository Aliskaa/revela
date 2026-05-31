// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack, Tooltip, Typography } from '@mui/material';

import { ProgressChip } from '@/components/common/chips';
import type { CampaignParticipantProgress } from '@aor/types';

const DIMENSIONS = [
    { key: 'self', short: 'Soi', label: 'Regard sur soi', field: 'selfRatingStatus' as const },
    { key: 'peer', short: 'Pairs', label: 'Pairs', field: 'peerFeedbackStatus' as const },
    { key: 'element', short: 'EH', label: 'Élément Humain', field: 'elementHumainStatus' as const },
] as const;

export type ParticipantProgressAvancementProps = {
    participant: CampaignParticipantProgress;
    /** Centré dans une cellule de tableau ; aligné au début dans une carte mobile. */
    align?: 'center' | 'flex-start';
};

/** Les trois jalons de collecte regroupés (chips compacts + libellé court). */
export function ParticipantProgressAvancement({
    participant,
    align = 'center',
}: ParticipantProgressAvancementProps) {
    return (
        <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            justifyContent={align === 'center' ? 'center' : 'flex-start'}
        >
            {DIMENSIONS.map(dimension => (
                <Tooltip key={dimension.key} title={dimension.label}>
                    <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 64 }}>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                lineHeight: 1,
                            }}
                        >
                            {dimension.short}
                        </Typography>
                        <ProgressChip status={participant[dimension.field]} compact />
                    </Stack>
                </Tooltip>
            ))}
        </Stack>
    );
}
