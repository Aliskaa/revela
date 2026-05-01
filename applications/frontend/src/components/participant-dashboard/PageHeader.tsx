// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Bell, Clock3, Users } from 'lucide-react';

import type { CampaignView, EffortEstimate } from '@/lib/participant/dashboardView';
import type { ParticipantSession } from '@aor/types';

export type PageHeaderProps = {
    campaignView: CampaignView;
    participantFirstName: string;
    assignments: ParticipantSession['assignments'];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
    effort: EffortEstimate;
};

export function PageHeader({
    campaignView,
    participantFirstName,
    assignments,
    selectedIndex,
    onSelectIndex,
    effort,
}: PageHeaderProps) {
    const effortText = effort.isComplete
        ? 'Parcours terminé'
        : `~${effort.remainingMinutes} min · ${effort.remainingSteps} étape${effort.remainingSteps > 1 ? 's' : ''}`;
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={3}
                    justifyContent="space-between"
                    alignItems={{ xs: 'start', lg: 'start' }}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Chip
                            label={campaignView.status}
                            sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                        />
                        <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                            Bonjour {participantFirstName},
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                        >
                            Vous êtes dans l’espace participant de la campagne{' '}
                            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {campaignView.name}
                            </Box>
                            . Le tableau de bord vous montre le contexte, la progression et la prochaine étape.
                        </Typography>
                        {assignments.length > 1 && (
                            <FormControl size="small" sx={{ mt: 2, minWidth: 300 }}>
                                <InputLabel>Campagne</InputLabel>
                                <Select
                                    label="Campagne"
                                    value={selectedIndex}
                                    onChange={e => onSelectIndex(e.target.value as number)}
                                >
                                    {assignments.map((a, i) => (
                                        <MenuItem key={`${a.campaign_id}-${a.questionnaire_id}`} value={i}>
                                            {a.campaign_name ?? 'Campagne'} —{' '}
                                            {a.questionnaire_title ?? a.questionnaire_id}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    <Stack spacing={1.4} sx={{ width: { xs: '100%', sm: 320 } }}>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 3,
                                        bgcolor: 'tint.primaryBg',
                                        color: 'primary.main',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Users size={16} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Coach
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.primary">
                                        {campaignView.coach}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 3,
                                        bgcolor: 'tint.secondaryBg',
                                        color: 'tint.secondaryText',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Bell size={16} />
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Prochaine action
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.primary">
                                        {campaignView.nextAction}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                        <Card variant="outlined">
                            <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 3,
                                        bgcolor: 'tint.successBg',
                                        color: 'tint.successText',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Clock3 size={16} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Temps restant estimé
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.primary">
                                        {effortText}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
