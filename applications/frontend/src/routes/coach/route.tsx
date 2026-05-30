// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Stack, Typography } from '@mui/material';
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Building2, ClipboardList, LayoutDashboard, ShieldAlert, UserRound } from 'lucide-react';

import { AppShellChromeProvider } from '@/components/layout/AppShellChromeContext';
import { ScopedAppShell, type ScopedNavItem } from '@/components/layout/ScopedAppShell';
import { parseAdminJwtClaims, userAdmin } from '@/lib/auth';

const coachNav: ScopedNavItem[] = [
    { label: 'Tableau de bord', to: '/coach', icon: LayoutDashboard, exact: true },
    { label: 'Mes campagnes', to: '/coach/campaigns', icon: ClipboardList },
    { label: 'Mes entreprises', to: '/coach/companies', icon: Building2 },
];

const coachFooterNavForSuperAdmin: ScopedNavItem[] = [
    { label: 'Retour mode admin', to: '/admin', icon: ArrowLeft, exact: true },
];

/**
 * Bandeau d'avertissement visible uniquement pour le super-admin consultant la vue coach.
 * Couleur ambre = signal « mode spécial / hors périmètre habituel ».
 */
function SuperAdminBanner() {
    return (
        <Box
            sx={{
                bgcolor: 'tint.adminBadgeBg',
                borderBottom: '1px solid',
                borderColor: 'tint.adminBadgeBorder',
                color: 'tint.adminBadgeText',
                px: { xs: 2, sm: 3, lg: 4 },
                py: 1.25,
            }}
        >
            <Stack direction="row" spacing={1.25} alignItems="center">
                <ShieldAlert size={18} />
                <Typography variant="body2" fontWeight={600}>
                    Mode coach — consulté depuis le compte admin. Vous voyez l'intégralité des données, sans restriction de périmètre.
                </Typography>
            </Stack>
        </Box>
    );
}

function CoachRouteLayout() {
    const navigate = useNavigate();
    const claims = parseAdminJwtClaims();
    const isSuperAdmin = claims?.scope === 'super-admin';

    const handleLogout = () => {
        userAdmin.removeToken();
        navigate({ to: '/admin/login' });
    };

    return (
        <AppShellChromeProvider>
            <ScopedAppShell
                brandLabel="Révéla"
                brandEyebrow={isSuperAdmin ? 'Vue coach (admin)' : 'Espace coach'}
                avatarInitial={isSuperAdmin ? 'A' : 'C'}
                nav={coachNav}
                footerNav={isSuperAdmin ? coachFooterNavForSuperAdmin : []}
                onLogout={handleLogout}
                topBanner={isSuperAdmin ? <SuperAdminBanner /> : undefined}
            >
                <Outlet />
            </ScopedAppShell>
        </AppShellChromeProvider>
    );
}

export const Route = createFileRoute('/coach')({
    /**
     * Garde route-level : tout admin authentifié peut accéder à `/coach`.
     * - Un coach y voit son périmètre filtré (`coachId` côté backend).
     * - Un super-admin y voit l'intégralité (le backend ne filtre pas pour `super-admin`),
     *   ce qui matérialise la règle « l'admin peut être un coach ».
     */
    beforeLoad: () => {
        if (!userAdmin.isAuthenticated()) {
            throw redirect({ to: '/admin/login' });
        }
    },
    component: CoachRouteLayout,
});
