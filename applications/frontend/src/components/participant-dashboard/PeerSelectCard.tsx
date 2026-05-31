// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { CampaignPeerChoice } from '@aor/types';
import { Box, Chip, Stack, Typography } from '@mui/material';

import { AppShellUserAvatar } from '@/components/layout/AppShellChrome';
import { personInitialsFromNames } from '@/lib/personInitials';

export type PeerSelectCardProps = {
    peer: CampaignPeerChoice;
    alreadyRated: boolean;
    selected: boolean;
    onClick: () => void;
};

/**
 * Carte de sélection d'un pair dans l'étape feedback des pairs : avatar (ou initiales),
 * nom + statut (à noter / sélectionné / noté). Désactivée une fois le pair évalué.
 */
export function PeerSelectCard({ peer, alreadyRated, selected, onClick }: PeerSelectCardProps) {
    const initials = personInitialsFromNames(peer.first_name, peer.last_name);

    return (
        <Stack
            direction="row"
            spacing={1.3}
            alignItems="center"
            onClick={alreadyRated ? undefined : onClick}
            sx={{
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'border',
                borderRadius: 4,
                p: 1.8,
                cursor: alreadyRated ? 'default' : 'pointer',
                bgcolor: selected ? 'tint.primaryHover' : 'background.paper',
                opacity: alreadyRated ? 0.7 : 1,
                transition: 'all 0.15s ease',
                ...(!alreadyRated ? { '&:hover': { borderColor: 'primary.main', bgcolor: 'tint.primaryGhost' } } : {}),
            }}
        >
            <AppShellUserAvatar
                src={peer.avatar_url}
                initials={initials}
                alt={peer.full_name}
                size={38}
                sx={{
                    borderRadius: 3,
                    bgcolor: selected ? 'tint.primaryActive' : 'tint.primaryBg',
                    color: 'primary.main',
                    flexShrink: 0,
                }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                    {peer.full_name}
                </Typography>
            </Box>
            {alreadyRated ? (
                <Chip
                    label="Noté"
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText' }}
                />
            ) : selected ? (
                <Chip
                    label="Sélectionné"
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }}
                />
            ) : (
                <Chip
                    label="À noter"
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }}
                />
            )}
        </Stack>
    );
}
