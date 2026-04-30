// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { ArrowRight, Lock } from 'lucide-react';
import type { ElementType } from 'react';

export type CampaignResultCardProps = {
    label: string;
    subtitle: string;
    description: string;
    icon: ElementType;
    locked: boolean;
    lockedHint: string;
    cta: string;
    ariaLabel: string;
    onClick: () => void;
};

export function CampaignResultCard({
    label,
    subtitle,
    description,
    icon: Icon,
    locked,
    lockedHint,
    cta,
    ariaLabel,
    onClick,
}: CampaignResultCardProps) {
    const content = (
        <Stack direction="row" spacing={1.5} alignItems="start" sx={{ width: '100%' }}>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 4,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                    ...(locked
                        ? { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }
                        : { bgcolor: 'tint.primaryBg', color: 'primary.main' }),
                }}
            >
                <Icon size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={1}
                >
                    <Box>
                        <Typography fontWeight={700} color="text.primary">
                            {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                    {description}
                </Typography>
                {locked ? (
                    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 1.2, color: 'text.disabled' }}>
                        <Lock size={14} />
                        <Typography variant="body2">{lockedHint}</Typography>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 1.2, color: 'primary.main' }}>
                        <Typography variant="body2" fontWeight={700}>
                            {cta}
                        </Typography>
                        <ArrowRight size={14} />
                    </Stack>
                )}
            </Box>
        </Stack>
    );

    if (locked) {
        return (
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: 4,
                    p: 2,
                    bgcolor: 'tint.mutedBg',
                    opacity: 0.85,
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <ButtonBase
            onClick={onClick}
            focusRipple
            aria-label={ariaLabel}
            sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: '1px solid',
                borderColor: 'border',
                borderRadius: 4,
                p: 2,
                bgcolor: '#fff',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 6px 18px -10px rgba(15,23,42,0.18)',
                },
                '&:focus-visible': {
                    borderColor: 'primary.main',
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                },
            }}
        >
            {content}
        </ButtonBase>
    );
}
