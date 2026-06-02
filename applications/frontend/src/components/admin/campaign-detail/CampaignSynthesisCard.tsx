// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';


import { surfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CampaignSynthesisCardScope = 'admin' | 'coach';

export type CampaignSynthesisCardProps = {
    campaignId: number;
    /** Détermine la route cible (`/admin/...` ou `/coach/...`). */
    scope: CampaignSynthesisCardScope;
};

const SYNTHESIS_ROUTE_BY_SCOPE: Record<
    CampaignSynthesisCardScope,
    '/admin/campaigns/$campaignId/synthese' | '/coach/campaigns/$campaignId/synthese'
> = {
    admin: '/admin/campaigns/$campaignId/synthese',
    coach: '/coach/campaigns/$campaignId/synthese',
};

/**
 * Carte d'accès rapide à la matrice de synthèse Élément B (PDF AOR section 9).
 * Pendant logique de `CampaignStatusActions` côté pilotage : un titre, un sous-titre, un CTA.
 * La sécurité est gérée côté backend (le coach reçoit `null` si la campagne n'est pas
 * dans son périmètre — la page synthèse affiche alors un message « hors périmètre »).
 */
export function CampaignSynthesisCard({ campaignId, scope }: CampaignSynthesisCardProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                ...surfaceCardSx,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                border: 'none',
                boxShadow: theme => theme.palette.shadow.brandHero,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: theme => theme.palette.tint.onPrimarySheen,
                    pointerEvents: 'none',
                },
            }
            }
        >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                        Synthèse Élément B
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'tint.onPrimaryText', lineHeight: 1.6 }}>
                        Vue agrégée du test scientifique pour tous les participants, avec mise en évidence
                        automatique des écarts forts.
                    </Typography>
                </Box>
                <Stack spacing={1.2}>
                    <Link to={SYNTHESIS_ROUTE_BY_SCOPE[scope]} params={{ campaignId: String(campaignId) }}>
                        <Button
                            fullWidth
                            variant='outlined'
                            disableElevation
                            startIcon={<BarChart3 size={16} />}
                            sx={{
                                borderRadius: 2,
                                borderColor: 'tint.onPrimaryBorder',
                                color: 'primary.contrastText',
                                bgcolor: 'tint.onPrimarySurface',
                                backdropFilter: 'blur(8px)',
                                '&:hover': {
                                    borderColor: 'tint.onPrimaryBorderHover',
                                    bgcolor: 'tint.onPrimarySurfaceHover',
                                },
                            }}
                        >
                            Voir la synthèse Élément B
                        </Button>
                    </Link>
                </Stack>
            </CardContent>
        </Card>
    );
}
