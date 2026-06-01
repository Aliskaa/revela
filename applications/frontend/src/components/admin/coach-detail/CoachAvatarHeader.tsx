// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, CircularProgress, Stack } from '@mui/material';
import { Camera } from 'lucide-react';
import * as React from 'react';

import { ParticipantAvatar } from '@/components/common/ParticipantAvatar';
import { coachInitial } from '@/lib/coachInitial';
import type { Coach } from '@aor/types';

export type CoachAvatarHeaderProps = {
    coach: Coach;
    allowAvatarEdit?: boolean;
    onAvatarUpload?: (file: File) => void | Promise<void>;
    isAvatarUploading?: boolean;
};

export function CoachAvatarHeader({
    coach,
    allowAvatarEdit = false,
    onAvatarUpload,
    isAvatarUploading = false,
}: CoachAvatarHeaderProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Box
            sx={{
                position: 'relative',
                flexShrink: 0,
                ...(allowAvatarEdit
                    ? {
                          cursor: isAvatarUploading ? 'default' : 'pointer',
                          '&:hover .coach-avatar-edit-overlay': { opacity: 1 },
                      }
                    : {}),
            }}
            onClick={() => {
                if (allowAvatarEdit && !isAvatarUploading) {
                    fileInputRef.current?.click();
                }
            }}
            role={allowAvatarEdit ? 'button' : undefined}
            tabIndex={allowAvatarEdit ? 0 : undefined}
            aria-label={allowAvatarEdit ? 'Changer la photo de profil' : undefined}
            onKeyDown={event => {
                if (!allowAvatarEdit || isAvatarUploading) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                }
            }}
        >
            <ParticipantAvatar
                src={coach.avatar_url}
                initials={coachInitial(coach.displayName)}
                alt={coach.displayName}
                size={56}
                sx={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    letterSpacing: '0.04em',
                    boxShadow: theme => theme.palette.shadow.brandMd,
                }}
            />
            {allowAvatarEdit ? (
                <>
                    <Box
                        className="coach-avatar-edit-overlay"
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            bgcolor: 'rgba(15, 23, 42, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isAvatarUploading ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            color: 'common.white',
                        }}
                    >
                        {isAvatarUploading ? (
                            <CircularProgress size={22} sx={{ color: 'common.white' }} />
                        ) : (
                            <Camera size={20} strokeWidth={1.75} aria-hidden />
                        )}
                    </Box>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            if (file && onAvatarUpload) {
                                void onAvatarUpload(file);
                            }
                        }}
                    />
                </>
            ) : null}
        </Box>
    );
}
