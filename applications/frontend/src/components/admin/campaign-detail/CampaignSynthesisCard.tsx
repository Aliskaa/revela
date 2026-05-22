// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';

import { surfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CampaignSynthesisCardScope = 'admin' | 'coach';

export type CampaignSynthesisCardProps = {
    campaignId: number;
    /** Détermine la route cible (`/admin/...` ou `/coach/...`). */
    scope: CampaignSynthesisCardScope;
    harmonized?: boolean;
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
export function CampaignSynthesisCard({ campaignId, scope, harmonized = false }: CampaignSynthesisCardProps) {
    return (
        <Card
            variant="outlined"
            sx={
                harmonized
                    ? {
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
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)',
                              pointerEvents: 'none',
                          },
                      }
                    : undefined
            }
        >
            <CardContent sx={{ p: harmonized ? 3 : 2.5, position: 'relative', zIndex: 1 }}>
                {harmonized ? (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                            Synthèse Élément B
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                            Vue agrégée du test scientifique pour tous les participants, avec mise en évidence
                            automatique des écarts forts.
                        </Typography>
                    </Box>
                ) : (
                    <SectionTitle
                        title="Synthèse Élément B"
                        subtitle="Vue agrégée du test scientifique pour tous les participants, avec mise en évidence automatique des écarts forts."
                    />
                )}
                <Stack spacing={1.2} sx={{ mt: harmonized ? 0 : 2 }}>
                    <Button
                        component={Link}
                        to={SYNTHESIS_ROUTE_BY_SCOPE[scope]}
                        params={{ campaignId: String(campaignId) }}
                        fullWidth
                        variant={harmonized ? 'outlined' : 'contained'}
                        disableElevation
                        startIcon={<BarChart3 size={16} />}
                        sx={
                            harmonized
                                ? {
                                      borderRadius: 2,
                                      borderColor: 'rgba(255,255,255,0.25)',
                                      color: 'primary.contrastText',
                                      bgcolor: 'rgba(255,255,255,0.1)',
                                      backdropFilter: 'blur(8px)',
                                      '&:hover': {
                                          borderColor: 'rgba(255,255,255,0.4)',
                                          bgcolor: 'rgba(255,255,255,0.2)',
                                      },
                                  }
                                : { borderRadius: 3 }
                        }
                    >
                        Voir la synthèse Élément B
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
