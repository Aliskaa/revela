// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantTransparencyScoreSnapshot } from '@aor/types';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { ArrowRight, Lock, ScanEye } from 'lucide-react';

export type CampaignTransparencyCardProps = {
    snapshot: ParticipantTransparencyScoreSnapshot | null;
    onClick?: () => void;
};

/**
 * Carte « Repère de transparence » (P23) côté participant.
 * - Tant que le coach n'a pas activé le calcul : état verrouillé.
 * - Une fois activé : affiche le score (en %) et le nombre de pairs ayant répondu, en gros
 *   à droite du libellé, conformément à la maquette validée.
 *   Si `onClick` est fourni → la carte devient cliquable (« Voir les résultats »).
 */
export function CampaignTransparencyCard({ snapshot, onClick }: CampaignTransparencyCardProps) {
    const locked = snapshot === null;
    const clickable = !locked && typeof onClick === 'function';

    const content = (
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
            <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
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
                    <Stack
                        direction="row"
                        spacing={0.7}
                        alignItems="center"
                        sx={{ mt: 1.2, color: clickable ? 'primary.main' : 'text.secondary' }}
                    >
                        <Typography variant="body2" fontWeight={clickable ? 700 : 400}>
                            {clickable ? 'Voir les résultats' : 'Score basé sur les feedbacks reçus.'}
                        </Typography>
                        {clickable && <ArrowRight size={14} />}
                    </Stack>
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
    );

    if (!clickable) {
        return (
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'border',
                    borderRadius: 4,
                    p: 2,
                bgcolor: locked ? 'tint.mutedBg' : 'background.paper',
                opacity: locked ? 0.85 : 1,
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <ButtonBase
            onClick={onClick}
            focusRipple
            aria-label="Repère de transparence — Voir les résultats"
            sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: '1px solid',
                borderColor: 'border',
                borderRadius: 4,
                p: 2,
                bgcolor: 'background.paper',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: theme => theme.palette.shadow.cardHoverLift,
                },
                '&:focus-visible': {
                    borderColor: 'primary.main',
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                },
            }}
        >
            {content}
        </ButtonBase>
    );
}
