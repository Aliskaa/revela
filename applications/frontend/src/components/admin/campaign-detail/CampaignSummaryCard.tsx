// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { CalendarDays } from 'lucide-react';

import { CampaignStatusChip } from '@/components/common/chips';
import type { AdminCampaign } from '@aor/types';

import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { SummaryField } from './SummaryField';

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
        <Card variant="outlined" sx={surfaceCardSx}>
            <CardContent sx={{ p: 4 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary.main"
                    sx={{ mb: 2, letterSpacing: -0.2, fontSize: '1.5rem' }}
                >
                    Résumé opérationnel
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                    Les informations clés pour piloter rapidement la campagne.
                </Typography>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <SummaryField label="Entreprise" value={companyName} />
                    <SummaryField label="Coach" value={coachName} />
                    <SummaryField label="Questionnaire" value={questionnaireLabel} />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Progression globale
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight={700}>
                            {progress}%
                        </Typography>
                    </Stack>
                    <Box
                        sx={{
                            height: 16,
                            width: '100%',
                            bgcolor: 'surface.lavenderGrey',
                            borderRadius: 99,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                height: '100%',
                                width: `${progress}%`,
                                borderRadius: 99,
                                backgroundImage: theme => theme.palette.surface.progressGradient,
                                transition: 'width 0.4s ease',
                            }}
                        />
                    </Box>
                </Box>

                <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: 'surface.lavenderGrey',
                            color: 'text.secondary',
                        }}
                    >
                        <CalendarDays size={18} strokeWidth={1.75} aria-hidden />
                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                            Créée le {createdLabel}
                        </Typography>
                    </Box>
                    <CampaignStatusChip status={campaign.status} />
                </Stack>
            </CardContent>
        </Card>
    );
}
