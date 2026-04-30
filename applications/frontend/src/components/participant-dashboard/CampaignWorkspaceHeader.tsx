// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, ButtonBase, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Sparkles } from 'lucide-react';

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

                    <Link to="/campaigns/$campaignId/coach" params={{ campaignId: String(campaignId) }}>
                        <ButtonBase
                            focusRipple
                            sx={{
                                width: { xs: '100%', sm: 340 },
                                textAlign: 'left',
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'border',
                                bgcolor: '#fff',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: '0 6px 18px -10px rgba(15,23,42,0.18)',
                                },
                            }}
                        >
                            <Box sx={{ p: 2, width: '100%' }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 4,
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Sparkles size={20} />
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Mon coach
                                        </Typography>
                                        <Typography fontWeight={800} color="text.primary">
                                            {coachName}
                                        </Typography>
                                    </Box>
                                    <ArrowRight size={16} />
                                </Stack>
                            </Box>
                        </ButtonBase>
                    </Link>
                </Stack>
            </CardContent>
        </Card>
    );
}
