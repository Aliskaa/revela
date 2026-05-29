// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
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

export type CampaignWorkspaceHeaderProps = {
    campaignId: number;
    campaignName: string;
    company: string;
    questionnaire: string;
    coachName: string;
};

export function CampaignWorkspaceHeader({
    campaignId,
    campaignName,
    company,
    questionnaire,
    coachName,
}: CampaignWorkspaceHeaderProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack
                    spacing={2.5}
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'start', lg: 'start' }}
                >
                    <Box>
                        <Chip
                            label="Campagne"
                            sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                        />
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                            {campaignName}
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                        >
                            {company} · {questionnaire}
                        </Typography>
                    </Box>

                    <CampaignCoachProfileLink campaignId={campaignId} coachName={coachName} />
                </Stack>
            </CardContent>
        </Card>
    );
}
