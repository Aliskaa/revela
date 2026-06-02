// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Chip, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { Copy } from 'lucide-react';
import * as React from 'react';

import { useParticipantTokens } from '@/hooks/admin';

export type ParticipantInvitationTokensPanelProps = {
    participantId: number;
    campaignId: number;
};

/** Liste des tokens d'invitation pour une campagne (table dépliée ou carte mobile). */
export function ParticipantInvitationTokensPanel({
    participantId,
    campaignId,
}: ParticipantInvitationTokensPanelProps) {
    const { data: allTokens = [], isLoading } = useParticipantTokens(participantId);
    const tokens = allTokens.filter(t => t.campaign_id === campaignId);
    const [copied, setCopied] = React.useState<string | null>(null);

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(url);
        setTimeout(() => setCopied(null), 2000);
    };

    if (isLoading) {
        return <Skeleton variant="text" width={300} />;
    }

    if (tokens.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                Aucun token d'invitation.
            </Typography>
        );
    }

    return (
        <Stack spacing={1}>
            <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
                Tokens d'invitation
            </Typography>
            {tokens.map(t => (
                <Stack
                    key={t.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                        border: '1px solid',
                        borderColor: 'border',
                        borderRadius: 2,
                        px: 1.5,
                        py: 1,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Chip
                        label={t.questionnaire_id}
                        size="small"
                        sx={{
                            borderRadius: 99,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            fontWeight: 700,
                        }}
                    />
                    <Chip
                        label={t.status}
                        size="small"
                        sx={{
                            borderRadius: 99,
                            bgcolor: t.status === 'active' ? 'tint.successBg' : 'tint.mutedBg',
                            color: t.status === 'active' ? 'tint.successText' : 'tint.mutedText',
                        }}
                    />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily: 'monospace',
                            fontSize: 12,
                        }}
                    >
                        {t.invite_url}
                    </Typography>
                    {t.expires_at ? (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            Exp. {new Date(t.expires_at).toLocaleDateString('fr-FR')}
                        </Typography>
                    ) : null}
                    <Tooltip title={copied === t.invite_url ? 'Copié !' : 'Copier le lien'}>
                        <IconButton
                            size="small"
                            onClick={() => handleCopy(t.invite_url)}
                            aria-label="Copier le lien d'invitation"
                        >
                            <Copy size={14} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ))}
        </Stack>
    );
}
