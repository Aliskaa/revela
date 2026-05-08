// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { CampaignSynthesisMatrix } from '@/components/admin/campaign-detail/CampaignSynthesisMatrix';
import { PageHeroCard } from '@/components/common/layout';
import { useAdminCampaignSynthesis } from '@/hooks/admin';

export type CampaignSynthesisScope = 'admin' | 'coach';

export type CampaignSynthesisPageProps = {
    scope: CampaignSynthesisScope;
    campaignId: number;
};

const SCOPE_CFG: Record<
    CampaignSynthesisScope,
    {
        backTo: '/admin/campaigns/$campaignId' | '/coach/campaigns/$campaignId';
        backLabel: string;
        notFound: string;
    }
> = {
    admin: {
        backTo: '/admin/campaigns/$campaignId',
        backLabel: 'Retour à la campagne',
        notFound: 'Campagne introuvable.',
    },
    coach: {
        backTo: '/coach/campaigns/$campaignId',
        backLabel: 'Retour à la campagne',
        notFound: 'Campagne introuvable ou hors de votre périmètre.',
    },
};

/**
 * Page dédiée à la synthèse Élément B d'une campagne (PDF AOR section 9).
 * Réutilisée côté admin et coach via la prop `scope` (le filtrage de périmètre est
 * fait côté backend, qui renvoie `null` quand la campagne n'est pas visible).
 */
export function CampaignSynthesisPage({ scope, campaignId }: CampaignSynthesisPageProps) {
    const cfg = SCOPE_CFG[scope];
    const { data: matrix, isLoading } = useAdminCampaignSynthesis(campaignId);

    const backButton = (
        <Link to={cfg.backTo} params={{ campaignId: campaignId.toString() }}>
            <Button
                variant="outlined"
                startIcon={<ArrowLeft size={16} />}
                sx={{ borderRadius: 3 }}
            >
                {cfg.backLabel}
            </Button>
        </Link>
    );

    if (isLoading) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={420} />
            </Stack>
        );
    }

    if (!matrix) {
        return (
            <Stack spacing={2}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            {cfg.notFound}
                        </Typography>
                    </CardContent>
                </Card>
                {backButton}
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <PageHeroCard
                eyebrow="Synthèse Élément B"
                title={matrix.campaignName}
                subtitle="Vue agrégée du test scientifique : tous les participants côte à côte, avec mise en lumière des écarts forts (>4)."
                actions={backButton}
            />
            <CampaignSynthesisMatrix matrix={matrix} />
        </Stack>
    );
}
