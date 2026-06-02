// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import { Sparkles } from 'lucide-react';

import { ParticipantAvatar } from '@/components/common/ParticipantAvatar';
import { coachInitial } from '@/lib/coachInitial';

export type CampaignCoachAvatarProps = {
    coachName: string;
    avatarUrl?: string | null;
    size?: number;
};

/** Avatar coach côté participant : photo si disponible, sinon initiale ou icône. */
export function CampaignCoachAvatar({ coachName, avatarUrl, size = 48 }: CampaignCoachAvatarProps) {
    if (avatarUrl) {
        return (
            <ParticipantAvatar
                src={avatarUrl}
                initials={coachInitial(coachName)}
                alt={coachName}
                size={size}
            />
        );
    }

    const hasName = coachName.trim().length > 0 && coachName !== 'Coach non attribué';
    if (hasName) {
        return (
            <ParticipantAvatar
                src={null}
                initials={coachInitial(coachName)}
                alt={coachName}
                size={size}
            />
        );
    }

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
            }}
        >
            <Sparkles size={size <= 40 ? 18 : 20} />
        </Box>
    );
}
