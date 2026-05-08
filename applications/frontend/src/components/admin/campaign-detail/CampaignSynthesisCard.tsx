// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent, Stack } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';

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
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Synthèse Élément B"
                    subtitle="Vue agrégée du test scientifique pour tous les participants, avec mise en évidence automatique des écarts forts."
                />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                    <Button
                        component={Link}
                        to={SYNTHESIS_ROUTE_BY_SCOPE[scope]}
                        params={{ campaignId: String(campaignId) }}
                        fullWidth
                        variant="contained"
                        disableElevation
                        startIcon={<BarChart3 size={16} />}
                        sx={{ borderRadius: 3 }}
                    >
                        Voir la synthèse Élément B
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
