// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Chip, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { ArrowLeftRight, HelpCircle } from 'lucide-react';

import { PEER_COLORS } from '@/lib/results/buildDimensions';
import type { DimensionView } from '@aor/types';

import { ScoreBar } from './ScoreBar';

export type DimensionCardProps = {
    dimension: DimensionView;
    likertMax: number;
};

export function DimensionCard({ dimension, likertMax }: DimensionCardProps) {
    const theme = useTheme();
    const hasPeers = dimension.rows.some(r => r.peers.some(p => p.value !== null));
    const hasScientific = dimension.rows.some(r => r.scientific !== null);

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
                    {dimension.name}
                </Typography>

                <Stack spacing={2}>
                    {dimension.rows.map(row => (
                        <Box key={row.label} sx={{ border: '1px solid', borderColor: 'border', borderRadius: 3, p: 2 }}>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                                {row.label}
                            </Typography>
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip
                                        label="Auto"
                                        size="small"
                                        sx={{
                                            borderRadius: 99,
                                            bgcolor: 'tint.primaryBg',
                                            color: 'primary.main',
                                            minWidth: 70,
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    />
                                    <ScoreBar value={row.self} max={likertMax} color={theme.palette.primary.main} />
                                </Stack>
                                {hasPeers &&
                                    row.peers.map((peer, i) =>
                                        peer.value !== null ? (
                                            <Stack key={peer.label} direction="row" spacing={1.5} alignItems="center">
                                                <Chip
                                                    label={peer.label}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: 99,
                                                        bgcolor: 'tint.secondaryBg',
                                                        color: 'tint.secondaryText',
                                                        minWidth: 70,
                                                        fontWeight: 700,
                                                        fontSize: 11,
                                                        maxWidth: 100,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                />
                                                <ScoreBar
                                                    value={peer.value}
                                                    max={likertMax}
                                                    color={PEER_COLORS[i % PEER_COLORS.length]}
                                                />
                                            </Stack>
                                        ) : null
                                    )}
                                {hasScientific && (
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Chip
                                            label="Test"
                                            size="small"
                                            sx={{
                                                borderRadius: 99,
                                                bgcolor: 'tint.successBg',
                                                color: 'tint.successText',
                                                minWidth: 70,
                                                fontWeight: 700,
                                                fontSize: 11,
                                            }}
                                        />
                                        <ScoreBar value={row.scientific} max={likertMax} color="rgb(4,120,87)" />
                                    </Stack>
                                )}
                            </Stack>
                        </Box>
                    ))}
                </Stack>

                {dimension.ecarts.length > 0 && (
                    <Box sx={{ mt: 2.5, p: 2, bgcolor: 'tint.subtleBg', borderRadius: 3 }}>
                        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                Analyse des écarts
                            </Typography>
                            <Tooltip
                                title="Un écart est la différence entre votre score « comportement actuel (e) » et votre score « comportement souhaité (w) ». Plus l'écart est grand, plus vous percevez un décalage entre ce que vous faites et ce que vous voudriez faire."
                                arrow
                            >
                                <Box
                                    component="span"
                                    sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help' }}
                                    aria-label="Définition d'un écart"
                                >
                                    <HelpCircle size={14} />
                                </Box>
                            </Tooltip>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            Ces écarts indiquent des différences entre le comportement actuel et souhaité.
                        </Typography>
                        <Stack spacing={1}>
                            {dimension.ecarts.map(ecart => (
                                <Stack
                                    key={ecart.message || `ecart-${String(ecart.value)}`}
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                >
                                    <Chip
                                        icon={<ArrowLeftRight size={14} />}
                                        label={`Écart : ${String(ecart.value)}`}
                                        size="small"
                                        sx={{
                                            borderRadius: 99,
                                            fontWeight: 700,
                                            fontSize: 12,
                                            bgcolor: ecart.value === 0 ? 'tint.successBg' : 'tint.secondaryBg',
                                            color: ecart.value === 0 ? 'tint.successText' : 'tint.secondaryText',
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                        {ecart.value === 0 ? 'Pas de différence significative.' : ecart.message}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
