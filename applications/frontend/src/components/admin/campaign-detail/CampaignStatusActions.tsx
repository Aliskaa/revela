// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Button, Card, CardContent, Stack, Tooltip, Typography } from '@mui/material';
import { Archive, Play, Square } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { useUpdateAdminCampaignStatus } from '@/hooks/admin';
import type { AdminCampaign } from '@aor/types';

import { harmonizedCardSx } from './campaignDetailHarmonizedStyles';

export type CampaignStatusActionsProps = {
    campaign: AdminCampaign;
    participantsCount: number;
    harmonized?: boolean;
};

export function CampaignStatusActions({ campaign, participantsCount, harmonized = false }: CampaignStatusActionsProps) {
    const updateStatus = useUpdateAdminCampaignStatus();

    const isPending = updateStatus.isPending;
    const cannotLaunch = participantsCount === 0;

    return (
        <Card variant="outlined" sx={harmonized ? harmonizedCardSx : undefined}>
            <CardContent sx={{ p: harmonized ? 3 : 2.5 }}>
                {harmonized ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                            Statut de la campagne
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            Les participants ne peuvent commencer que si la campagne est active.
                        </Typography>
                    </Box>
                ) : (
                    <SectionTitle
                        title="Statut de la campagne"
                        subtitle="Les participants ne peuvent commencer que si la campagne est active."
                    />
                )}
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                    {campaign.status === 'draft' && cannotLaunch && (
                        <Alert severity="warning">
                            Invitez au moins un participant avant de pouvoir lancer la campagne.
                        </Alert>
                    )}
                    {campaign.status === 'draft' && (
                        <Tooltip
                            title={cannotLaunch ? 'Aucun participant invité — impossible de lancer la campagne.' : ''}
                            disableHoverListener={!cannotLaunch}
                        >
                            <span>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    disableElevation
                                    startIcon={<Play size={16} />}
                                    disabled={isPending || cannotLaunch}
                                    onClick={() =>
                                        updateStatus.mutate({
                                            campaignId: campaign.id,
                                            status: 'active',
                                            align_starts_at_to_now: true,
                                        })
                                    }
                                    sx={
                                        harmonized
                                            ? {
                                                  borderRadius: 2,
                                                  bgcolor: 'tint.successText',
                                                  fontWeight: 700,
                                                  '&:hover': { bgcolor: 'rgb(3,100,70)' },
                                              }
                                            : {
                                                  borderRadius: 3,
                                                  bgcolor: 'rgb(4,120,87)',
                                                  '&:hover': { bgcolor: 'rgb(3,100,70)' },
                                              }
                                    }
                                >
                                    {isPending ? 'En cours…' : 'Lancer la campagne'}
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    {campaign.status === 'active' && (
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Square size={16} />}
                            disabled={isPending}
                            onClick={() => updateStatus.mutate({ campaignId: campaign.id, status: 'closed' })}
                            sx={
                                harmonized
                                    ? {
                                          borderRadius: 2,
                                          bgcolor: 'secondary.main',
                                          color: 'primary.main',
                                          fontWeight: 700,
                                          boxShadow: '0 8px 24px rgba(255, 204, 0, 0.25)',
                                          '&:hover': { bgcolor: 'secondary.main', filter: 'brightness(0.95)' },
                                      }
                                    : {
                                          borderRadius: 3,
                                          bgcolor: 'rgb(180,120,0)',
                                          '&:hover': { bgcolor: 'rgb(150,100,0)' },
                                      }
                            }
                        >
                            {isPending ? 'En cours…' : 'Clôturer la campagne'}
                        </Button>
                    )}
                    {(campaign.status === 'draft' || campaign.status === 'active' || campaign.status === 'closed') && (
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
