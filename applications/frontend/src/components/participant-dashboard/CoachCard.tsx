// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { UserRound } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';
import type { CampaignView } from '@/lib/participant/dashboardView';

export type CoachCardProps = {
    campaignView: CampaignView;
};

export function CoachCard({ campaignView }: CoachCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Mon coach" subtitle="La personne qui accompagne la restitution" />
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ borderRadius: 4, bgcolor: 'rgba(15,23,42,0.03)', p: 2 }}
                >
                    <Box
                        sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 4,
                            bgcolor: 'primary.main',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <UserRound size={22} />
                    </Box>
                    <Box>
                        <Typography fontWeight={700} color="text.primary">
                            {campaignView.coach}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Coach référente Révéla
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
