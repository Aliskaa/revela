// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Avatar, type SxProps, type Theme } from '@mui/material';

export type ParticipantAvatarProps = {
    src?: string | null;
    initials: string;
    alt?: string;
    size?: number;
    sx?: SxProps<Theme>;
};

/** Avatar participant : photo si `src` est fourni, sinon initiales. */
export function ParticipantAvatar({ src, initials, alt, size = 40, sx }: ParticipantAvatarProps) {
    return (
        <Avatar
            src={src ?? undefined}
            alt={alt ?? initials}
            sx={{
                width: size,
                height: size,
                bgcolor: 'primary.main',
                fontWeight: 700,
                fontSize: size <= 36 ? '0.875rem' : '1rem',
                letterSpacing: '0.04em',
                flexShrink: 0,
                ...sx,
            }}
        >
            {initials}
        </Avatar>
    );
}
