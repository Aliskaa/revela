// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { ClipboardList, LayoutDashboard, Sparkles, UserRound } from 'lucide-react';

import { AppShellChromeProvider } from '@/components/layout/AppShellChromeContext';
import { FooterLayout } from '@/components/layout/FooterLayout';
import { ScopedAppShell, type ScopedNavItem } from '@/components/layout/ScopedAppShell';
import { parseAdminJwtClaims, userAdmin, userParticipant } from '@/lib/auth';

const participantNav: ScopedNavItem[] = [
    { label: 'Tableau de bord', to: '/', icon: LayoutDashboard, exact: true },
    { label: 'Mes campagnes', to: '/campaigns', icon: ClipboardList },
    { label: 'Mon profil', to: '/profile', icon: UserRound },
];

function ParticipantRouteLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        userParticipant.removeToken();
        navigate({ to: '/login' });
    };

    return (
        <AppShellChromeProvider>
            <ScopedAppShell
                brandLabel="Révéla"
                brandEyebrow="Espace participant"
                avatarInitial="P"
                nav={participantNav}
                onLogout={handleLogout}
                footer={<FooterLayout />}
            >
                <Outlet />
            </ScopedAppShell>
        </AppShellChromeProvider>
    );
}

export const Route = createFileRoute('/_participant')({
    /**
     * Garde route-level pour l'espace participant (à la racine `/` depuis 2026-04-28).
     *
     * Cas gérés :
     * 1. Un admin (super-admin) authentifié qui tape `/` → redirection vers `/admin`.
     * 2. Un coach authentifié qui tape `/` → redirection vers `/coach`.
     * 3. Un participant authentifié → laisse passer (chrome participant montée).
     * 4. Aucun token valide → redirection vers `/login`.
     *
     * La route `/login` a sa propre `beforeLoad` qui redirige vers `/` si déjà authentifié
     * comme participant — pas de boucle.
     */
    beforeLoad: () => {
        if (userAdmin.isAuthenticated()) {
            const claims = parseAdminJwtClaims();
            if (claims?.scope === 'coach') {
                throw redirect({ to: '/coach' });
            }
            throw redirect({ to: '/admin' });
        }
        if (!userParticipant.isAuthenticated()) {
            throw redirect({ to: '/login' });
        }
    },
    component: ParticipantRouteLayout,
});
