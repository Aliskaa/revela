// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { Camera } from 'lucide-react';
import * as React from 'react';

import { ParticipantAvatar } from '@/components/common/ParticipantAvatar';
import { companyInitial } from '@/lib/companyInitial';
import type { Company } from '@aor/types';

export type CompanyAvatarHeaderProps = {
    company: Company;
    allowAvatarEdit?: boolean;
    onAvatarUpload?: (file: File) => void | Promise<void>;
    isAvatarUploading?: boolean;
};

export function CompanyAvatarHeader({
    company,
    allowAvatarEdit = false,
    onAvatarUpload,
    isAvatarUploading = false,
}: CompanyAvatarHeaderProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Box
                sx={{
                    position: 'relative',
                    flexShrink: 0,
                    ...(allowAvatarEdit
                        ? {
                              cursor: isAvatarUploading ? 'default' : 'pointer',
                              '&:hover .company-avatar-edit-overlay': { opacity: 1 },
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
                aria-label={allowAvatarEdit ? 'Changer le logo de l’entreprise' : undefined}
                onKeyDown={event => {
                    if (!allowAvatarEdit || isAvatarUploading) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
            >
                <ParticipantAvatar
                    src={company.avatar_url}
                    initials={companyInitial(company.name)}
                    alt={company.name}
                    size={72}
                    sx={{
                        borderRadius: 2,
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        boxShadow: theme => theme.palette.shadow.brandMd,
                    }}
                />
                {allowAvatarEdit ? (
                    <>
                        <Box
                            className="company-avatar-edit-overlay"
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 2,
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
                                <CircularProgress size={24} sx={{ color: 'common.white' }} />
                            ) : (
                                <Camera size={22} strokeWidth={1.75} aria-hidden />
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
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                    }}
                >
                    {company.name}
                </Typography>
            </Box>
        </Stack>
    );
}
