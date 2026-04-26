// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent, Stack } from '@mui/material';
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

    const handleInvite = () => {
        inviteParticipants.mutate({ campaignId: campaign.id });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
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
            }
        );
    };

    const isArchived = campaign.status === 'archived';

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
                        sx={{ borderRadius: 3, bgcolor: 'primary.main', textTransform: 'none' }}
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
                        disabled={importParticipants.isPending || isArchived}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ borderRadius: 3, textTransform: 'none' }}
                    >
                        {importParticipants.isPending ? 'Import…' : 'Importer un CSV'}
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
