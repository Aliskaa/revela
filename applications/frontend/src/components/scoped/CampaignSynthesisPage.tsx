// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Link as MuiLink, Skeleton, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

import { CampaignSynthesisMatrix } from '@/components/admin/campaign-detail/CampaignSynthesisMatrix';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCampaignSynthesis } from '@/hooks/admin';

export type CampaignSynthesisScope = 'admin' | 'coach';

export type CampaignSynthesisPageProps = {
    scope: CampaignSynthesisScope;
    campaignId: number;
};

const SUBTITLE_SUFFIX =
    'Vue agrégée du test scientifique : tous les participants côte à côte, avec mise en lumière des écarts forts.';

const SCOPE_CFG: Record<
    CampaignSynthesisScope,
    {
        campaignsListTo: '/admin/campaigns' | '/coach/campaigns';
        campaignDetailTo: (campaignId: number) => string;
        notFound: string;
    }
> = {
    admin: {
        campaignsListTo: '/admin/campaigns',
        campaignDetailTo: campaignId => `/admin/campaigns/${campaignId}`,
        notFound: 'Campagne introuvable.',
    },
    coach: {
        campaignsListTo: '/coach/campaigns',
        campaignDetailTo: campaignId => `/coach/campaigns/${campaignId}`,
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
    const isAdmin = scope === 'admin';
    const { data: matrix, isLoading } = useAdminCampaignSynthesis(campaignId);

    useBreadcrumbs(
        isAdmin
            ? matrix
                ? [
                      { label: 'Administration' },
                      { label: 'Campagnes', to: cfg.campaignsListTo },
                      {
                          label: matrix.campaignName,
                          to: cfg.campaignDetailTo(campaignId),
                      },
                      { label: 'Synthèse Élément B' },
                  ]
                : [{ label: 'Administration' }, { label: 'Campagnes', to: cfg.campaignsListTo }]
            : matrix
              ? [
                    { label: 'Campagnes', to: cfg.campaignsListTo },
                    {
                        label: matrix.campaignName,
                        to: cfg.campaignDetailTo(campaignId),
                    },
                    { label: 'Synthèse Élément B' },
                ]
              : [{ label: 'Campagnes', to: cfg.campaignsListTo }]
    );

    if (isLoading) {
        return (
            <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" aria-label="Chargement de la synthèse">
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="text" width="60%" height={48} />
                <Skeleton variant="rounded" height={420} />
            </Stack>
        );
    }

    if (!matrix) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {cfg.notFound}
                </Typography>
                <MuiLink
                    component={Link}
                    to={cfg.campaignsListTo}
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                >
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    Synthèse Élément B
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {matrix.campaignName} — {SUBTITLE_SUFFIX}
                </Typography>
            </Box>

            <CampaignSynthesisMatrix matrix={matrix} />
        </Stack>
    );
}
