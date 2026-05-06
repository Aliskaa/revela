// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantTransparencyScoreSnapshot } from '@aor/types';
import { Box, Stack, Typography } from '@mui/material';
import { Lock, ScanEye } from 'lucide-react';

export type CampaignTransparencyCardProps = {
    snapshot: ParticipantTransparencyScoreSnapshot | null;
};

/**
 * Carte « Repère de transparence » (P23) côté participant.
 * - Tant que le coach n'a pas activé le calcul : état verrouillé.
 * - Une fois activé : affiche le score (en %) et le nombre de pairs ayant répondu, en gros
 *   à droite du libellé, conformément à la maquette validée.
 */
export function CampaignTransparencyCard({ snapshot }: CampaignTransparencyCardProps) {
    const locked = snapshot === null;

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'border',
                borderRadius: 4,
                p: 2,
                bgcolor: locked ? 'tint.mutedBg' : '#fff',
                opacity: locked ? 0.85 : 1,
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 4,
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                        ...(locked
                            ? { bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }
                            : { bgcolor: 'tint.primaryBg', color: 'primary.main' }),
                    }}
                >
                    <ScanEye size={18} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={700} color="text.primary">
                        Repère de transparence
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Comparaison entre vos réponses et celles de vos pairs
                    </Typography>
                    {locked ? (
                        <Stack
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                            sx={{ mt: 1.2, color: 'text.disabled' }}
                        >
                            <Lock size={14} />
                            <Typography variant="body2">
                                Disponible une fois que votre coach aura déclenché le calcul.
                            </Typography>
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                            Score basé sur les feedbacks reçus de vos pairs.
                        </Typography>
                    )}
                </Box>
                {!locked && snapshot !== null && (
                    <Stack alignItems="flex-end" sx={{ flex: 'none', ml: 1 }}>
                        <Typography
                            sx={{
                                fontSize: { xs: 32, md: 40 },
                                fontWeight: 800,
                                lineHeight: 1,
                                color: 'primary.main',
                                letterSpacing: -1,
                            }}
                        >
                            {snapshot.value}
                            <Box component="span" sx={{ fontSize: '0.6em', fontWeight: 700, ml: 0.5 }}>
                                %
                            </Box>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            suite à {snapshot.peer_count}{' '}
                            {snapshot.peer_count > 1 ? 'feedbacks pairs' : 'feedback pair'}
                        </Typography>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
