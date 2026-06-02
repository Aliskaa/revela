// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { CampaignCoachAvatar } from '@/components/participant-dashboard/CampaignCoachAvatar';
import { interactiveSurfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CampaignCoachProfileLinkProps = {
    campaignId: number;
    coachName: string;
    coachAvatarUrl?: string | null;
};

export function CampaignCoachProfileLink({
    campaignId,
    coachName,
    coachAvatarUrl,
}: CampaignCoachProfileLinkProps) {
    return (
        <Link to="/campaigns/$campaignId/coach" params={{ campaignId: String(campaignId) }} style={{ textDecoration: 'none' }}>
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
                        <CampaignCoachAvatar coachName={coachName} avatarUrl={coachAvatarUrl} size={48} />
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
