// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { CalendarDays, Clock3 } from 'lucide-react';

import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import type { AdminCampaign } from '@aor/types';

import { StatusChip } from './StatusChip';

export type CampaignSummaryCardProps = {
    campaign: AdminCampaign;
    companyName: string;
    coachName: string;
    questionnaireLabel: string;
    progress: number;
};

export function CampaignSummaryCard({
    campaign,
    companyName,
    coachName,
    questionnaireLabel,
    progress,
}: CampaignSummaryCardProps) {
    const createdLabel = campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('fr-FR') : '–';
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Résumé opérationnel"
                    subtitle="Les informations clés pour piloter rapidement la campagne."
                />

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2,
                        mt: 2,
                    }}
                >
                    <MiniStat label="Entreprise" value={companyName} />
                    <MiniStat label="Coach" value={coachName} />
                    <MiniStat label="Questionnaire" value={questionnaireLabel} />
                </Box>

                <Box sx={{ mt: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Progression
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            mt: 1,
                            height: 10,
                            borderRadius: 99,
                            bgcolor: 'rgba(15,23,42,0.06)',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                    />
                </Box>

                <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<CalendarDays size={14} />}
                        label={`Créée le ${createdLabel}`}
                        sx={{ borderRadius: 99 }}
                    />
                    {campaign.startsAt && (
                        <Chip
                            icon={<Clock3 size={14} />}
                            label={`Début ${new Date(campaign.startsAt).toLocaleDateString('fr-FR')}`}
                            sx={{ borderRadius: 99 }}
                        />
                    )}
                    {campaign.endsAt && (
                        <Chip
                            icon={<Clock3 size={14} />}
                            label={`Fin ${new Date(campaign.endsAt).toLocaleDateString('fr-FR')}`}
                            sx={{ borderRadius: 99 }}
                        />
                    )}
                    <StatusChip status={campaign.status} />
                </Stack>
            </CardContent>
        </Card>
    );
}
