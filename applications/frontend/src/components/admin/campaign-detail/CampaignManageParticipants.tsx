// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { Send, Upload } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { useImportParticipantsToCampaign, useInviteCampaignParticipants } from '@/hooks/admin';
import type { AdminCampaign } from '@aor/types';

export type CampaignManageParticipantsProps = {
    campaign: AdminCampaign;
};

export function CampaignManageParticipants({ campaign }: CampaignManageParticipantsProps) {
    const inviteParticipants = useInviteCampaignParticipants();
    const importParticipants = useImportParticipantsToCampaign();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [csvFileName, setCsvFileName] = React.useState<string | null>(null);

    const handleInvite = () => {
        inviteParticipants.mutate({ campaignId: campaign.id });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setCsvFileName(file.name);
        const formData = new FormData();
        formData.append('file', file);
        importParticipants.mutate(
            { campaignId: campaign.id, formData },
            {
                onSettled: () => {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
                onSuccess: () => {
                    setCsvFileName(null);
                },
            }
        );
    };

    const isArchived = campaign.status === 'archived';
    const isImporting = importParticipants.isPending;

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Gérer les participants"
                    subtitle="Inviter les participants de l'entreprise ou importer un fichier CSV."
                />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<Send size={16} />}
                        disabled={inviteParticipants.isPending || isArchived}
                        onClick={handleInvite}
                        sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                    >
                        {inviteParticipants.isPending ? 'Envoi…' : 'Inviter les participants'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        hidden
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Upload size={16} />}
                        disabled={isImporting || isArchived}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ borderRadius: 3 }}
                    >
                        {isImporting ? 'Import en cours…' : 'Importer un CSV'}
                    </Button>
                    {isImporting && csvFileName && (
                        // biome-ignore lint/a11y/useSemanticElements: role="status" sur Box volontaire — pas de progress numérique à exposer via <output>.
                        <Box
                            role="status"
                            aria-live="polite"
                            aria-busy="true"
                            sx={{ borderRadius: 3, bgcolor: 'tint.subtleBg', p: 1.5 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Lecture & invitation des participants
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={700}
                                color="text.primary"
                                sx={{
                                    mt: 0.4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {csvFileName}
                            </Typography>
                            <LinearProgress
                                aria-label="Import du fichier CSV"
                                sx={{
                                    mt: 1,
                                    height: 6,
                                    borderRadius: 99,
                                    bgcolor: 'rgba(15,23,42,0.06)',
                                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                                }}
                            />
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
