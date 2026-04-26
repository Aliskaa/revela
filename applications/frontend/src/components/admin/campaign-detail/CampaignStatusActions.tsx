// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Archive, Play, Square } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { useUpdateAdminCampaignStatus } from '@/hooks/admin';
import type { AdminCampaign } from '@aor/types';

export type CampaignStatusActionsProps = {
    campaign: AdminCampaign;
};

export function CampaignStatusActions({ campaign }: CampaignStatusActionsProps) {
    const updateStatus = useUpdateAdminCampaignStatus();

    const isPending = updateStatus.isPending;

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Statut de la campagne"
                    subtitle="Les participants ne peuvent commencer que si la campagne est active."
                />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                    {campaign.status === 'draft' && (
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Play size={16} />}
                            disabled={isPending}
                            onClick={() =>
                                updateStatus.mutate({
                                    campaignId: campaign.id,
                                    status: 'active',
                                    align_starts_at_to_now: true,
                                })
                            }
                            sx={{
                                borderRadius: 3,
                                bgcolor: 'rgb(4,120,87)',
                                '&:hover': { bgcolor: 'rgb(3,100,70)' },
                            }}
                        >
                            {isPending ? 'En cours…' : 'Lancer la campagne'}
                        </Button>
                    )}
                    {campaign.status === 'active' && (
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Square size={16} />}
                            disabled={isPending}
                            onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: 'closed' })}
                            sx={{
                                borderRadius: 3,
                                bgcolor: 'rgb(180,120,0)',
                                '&:hover': { bgcolor: 'rgb(150,100,0)' },
                            }}
                        >
                            {isPending ? 'En cours…' : 'Clôturer la campagne'}
                        </Button>
                    )}
                    {(campaign.status === 'draft' ||
                        campaign.status === 'active' ||
                        campaign.status === 'closed') && (
                        <Button
                            variant="outlined"
                            startIcon={<Archive size={16} />}
                            disabled={isPending}
                            onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: 'archived' })}
                            sx={{ borderRadius: 3, color: 'text.secondary' }}
                        >
                            Archiver
                        </Button>
                    )}
                    {campaign.status === 'archived' && (
                        <Typography variant="body2" color="text.secondary">
                            Cette campagne est archivée. Aucune action disponible.
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
