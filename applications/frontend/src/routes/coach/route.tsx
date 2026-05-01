// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { Building2, ClipboardList, Gauge, UserRound } from 'lucide-react';

import { ScopedAppShell, type ScopedNavItem } from '@/components/layout/ScopedAppShell';
import { parseAdminJwtClaims, userAdmin } from '@/lib/auth';

const coachNav: ScopedNavItem[] = [
    { label: 'Tableau de bord', to: '/coach', icon: Gauge, exact: true },
    { label: 'Mes campagnes', to: '/coach/campaigns', icon: ClipboardList },
    { label: 'Mes entreprises', to: '/coach/companies', icon: Building2 },
];

function CoachRouteLayout() {
    return (
        <ScopedAppShell
            brandIcon={UserRound}
            brandLabel="Révéla"
            brandEyebrow="Espace coach"
            avatarInitial="C"
            nav={coachNav}
        >
            <Outlet />
        </ScopedAppShell>
    );
}

export const Route = createFileRoute('/coach')({
    /**
     * Garde route-level : le coach doit être authentifié ET avoir scope=coach.
     * Un super-admin qui tape `/coach` est renvoyé sur `/admin` (son périmètre habituel).
     * Cf. ADR-008 et docs/avancement-2026-04-28.md §2 décision 2.
     */
    beforeLoad: () => {
        if (!userAdmin.isAuthenticated()) {
            throw redirect({ to: '/admin/login' });
        }
        const claims = parseAdminJwtClaims();
        if (claims?.scope !== 'coach') {
            throw redirect({ to: '/admin' });
        }
    },
    component: CoachRouteLayout,
});
