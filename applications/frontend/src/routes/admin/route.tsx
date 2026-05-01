import { Box, InputBase, Stack, Typography } from '@mui/material';
import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router';
import { Building2, ClipboardList, LayoutDashboard, Search, Shield, Sparkles, UserRound } from 'lucide-react';

import { ScopedAppShell, type ScopedNavItem } from '@/components/layout/ScopedAppShell';
import { parseAdminJwtClaims, userAdmin } from '@/lib/auth';

/**
 * Pas d'item « Réponses » : une réponse n'a de sens que rattachée à un participant et à une
 * campagne. La consultation se fait depuis la fiche campagne (table participants → matrix) ou
 * la fiche participant — pas de vue cross-campagnes en V1.
 */
const adminNav: ScopedNavItem[] = [
    { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Campagnes', to: '/admin/campaigns', icon: ClipboardList },
    { label: 'Entreprises', to: '/admin/companies', icon: Building2 },
    { label: 'Coachs', to: '/admin/coaches', icon: UserRound },
    { label: 'Questionnaires', to: '/admin/questionnaires', icon: Sparkles },
];

function AdminDesktopTopBar() {
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ display: { xs: 'none', lg: 'flex' }, mb: 3 }}
        >
            <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    Vue d'ensemble
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Pilotage global des campagnes, participants et coachs.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    minWidth: 320,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: 'border',
                    bgcolor: 'background.paper',
                }}
            >
                <Search size={16} color="rgb(100,116,139)" />
                <InputBase
                    placeholder="Recherche globale…"
                    inputProps={{ 'aria-label': 'Recherche globale' }}
                    sx={{ width: '100%', fontSize: 14 }}
                />
            </Box>
        </Stack>
    );
}

function AdminRoot() {
    const location = useLocation();
    const isLogin = location.pathname === '/admin/login';

    if (isLogin) return <Outlet />;

    return (
        <ScopedAppShell
            brandIcon={Shield}
            brandLabel="Révéla"
            brandEyebrow="Administration"
            avatarInitial="A"
            nav={adminNav}
            desktopTopBar={<AdminDesktopTopBar />}
        >
            <Outlet />
        </ScopedAppShell>
    );
}

export const Route = createFileRoute('/admin')({
    /**
     * Garde route-level :
     * 1. Redirige les non-authentifiés vers `/admin/login` AVANT que la chrome admin
     *    ne soit montée (évite le flash visuel + le 401 silencieux côté API).
     * 2. Bloque les coaches qui essaieraient d'accéder à `/admin/*` : ils sont
     *    redirigés vers leur propre espace `/coach`. Cf. ADR-008 + V1.5 décision
     *    « 3 espaces distincts (admin / coach / participant) — un coach ne doit
     *    jamais voir la chrome admin ».
     * Skip pour `/admin/login` lui-même afin d'éviter une boucle.
     */
    beforeLoad: ({ location }) => {
        if (location.pathname === '/admin/login') {
            return;
        }
        if (!userAdmin.isAuthenticated()) {
            throw redirect({ to: '/admin/login' });
        }
        const claims = parseAdminJwtClaims();
        if (claims?.scope === 'coach') {
            throw redirect({ to: '/coach' });
        }
    },
    component: AdminRoot,
});
