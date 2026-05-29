// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Sparkles } from 'lucide-react';

import { interactiveSurfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CampaignCoachProfileLinkProps = {
    campaignId: number;
    coachName: string;
};

export function CampaignCoachProfileLink({ campaignId, coachName }: CampaignCoachProfileLinkProps) {
    return (
        <Link to="/campaigns/$campaignId/coach" params={{ campaignId: String(campaignId) }}>
            <ButtonBase
                focusRipple
                sx={{
                    width: { xs: '100%', sm: 340 },
                    textAlign: 'left',
                    display: 'block',
                    ...interactiveSurfaceCardSx,
                }}
            >
                <Box sx={{ p: 2.5, width: '100%' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Sparkles size={20} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Mon coach
                            </Typography>
                            <Typography fontWeight={800} color="text.primary" sx={{ lineHeight: 1.3 }}>
                                {coachName}
                            </Typography>
                        </Box>
                        <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0 }}>
                            <ArrowRight size={16} />
                        </Box>
                    </Stack>
                </Box>
            </ButtonBase>
        </Link>
    );
}
