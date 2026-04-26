// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, LinearProgress, Typography } from '@mui/material';

import { SectionTitle } from '@/components/common/SectionTitle';
import type { CampaignView } from '@/lib/participant/dashboardView';

export type CampaignCardProps = {
    campaignView: CampaignView;
};

export function CampaignCard({ campaignView }: CampaignCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Campagne active" subtitle="Contexte du parcours participant" />

                <Card variant="outlined" sx={{ bgcolor: 'primary.main', color: '#fff', p: 2.2 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Campagne
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                        {campaignView.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.75 }}>
                        {campaignView.company} · {campaignView.status}
                    </Typography>
                </Card>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Progression
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={campaignView.progress}
                        sx={{
                            height: 10,
                            borderRadius: 99,
                            bgcolor: 'tint.subtleBg',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
