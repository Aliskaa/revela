// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    APP_SHELL_CONTENT_MAX_WIDTH,
    APP_SHELL_SIDEBAR_WIDTH,
    AppShellMobileChrome,
    AppShellSidebar,
    AppShellTopBar,
} from '@/components/layout/AppShellChrome';
import {
    Box
} from '@mui/material';
import { useLocation } from '@tanstack/react-router';
import * as React from 'react';

export type ScopedNavItem = {
    label: string;
    to: string;
    icon: React.ElementType;
    /** Si `true`, l'item n'est actif que sur l'égalité stricte (sinon `startsWith`). */
    exact?: boolean;
};

export type ScopedAppShellProps = {
    brandLabel: string;
    /** Sous-titre du logo (ex. "Administration", "Espace coach", "Espace participant"). */
    brandEyebrow: string;
    /** Initiale affichée dans l'avatar mobile. */
    avatarInitial: string;
    nav: ScopedNavItem[];
    /** Liens bas de sidebar. (ex. Vue coach) */
    footerNav?: ScopedNavItem[];
    /**
     * Callback déclenché par les boutons « Déconnexion » (sidebar desktop + drawer mobile).
     * Chaque scope passe son propre comportement (`userAdmin.removeToken()` + redirect admin
     * pour admin/coach, `userParticipant.removeToken()` + redirect login pour participant).
     */
    onLogout: () => void;
    /**
     * Bandeau optionnel en pleine largeur, posé au-dessus du contenu principal (et juste sous
     * la topbar mobile). Utilisé pour signaler un mode dégradé/spécial (ex. super-admin
     * consultant la vue coach).
     */
    topBanner?: React.ReactNode;
    /**
     * Footer optionnel rendu sous le contenu principal. Utilisé par l'espace participant
     * pour afficher mentions légales et lien confidentialité (admin/coach n'en ont pas).
     */
    footer?: React.ReactNode;
    children: React.ReactNode;
};

/**
 * Coque applicative partagée par les espaces admin, coach et participant
 * (sidebar + topbar mobile + zone main + footer optionnel). La logique d'auth est déléguée
 * au caller via `onLogout` — chaque scope choisit `userAdmin` ou `userParticipant` et la
 * route de redirection.
 */
export function ScopedAppShell({
    brandLabel,
    brandEyebrow,
    avatarInitial,
    nav,
    footerNav = [],
    onLogout,
    topBanner,
    footer,
    children,
}: ScopedAppShellProps) {
    const location = useLocation();

    const sidebarProps = {
        brandLabel,
        brandEyebrow,
        nav,
        footerNav,
        pathname: location.pathname,
        onLogout,
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'surface.softWhite' }}>
            <AppShellMobileChrome {...sidebarProps} avatarInitial={avatarInitial} />
            <AppShellSidebar {...sidebarProps} />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    ml: { xs: 0, lg: `${APP_SHELL_SIDEBAR_WIDTH}px` },
                    minWidth: 0,
                }}
            >
                <AppShellTopBar avatarInitial={avatarInitial} />
                {topBanner}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        px: { xs: 2, sm: 3, lg: 5 },
                        py: { xs: 2, sm: 3, lg: 5 },
                    }}
                >
                    <Box sx={{ maxWidth: APP_SHELL_CONTENT_MAX_WIDTH, mx: 'auto', width: '100%' }}>
                        {children}
                    </Box>
                </Box>
                {footer}
            </Box>
        </Box>
    );
}
