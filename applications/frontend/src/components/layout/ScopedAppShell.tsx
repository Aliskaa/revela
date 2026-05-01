// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronRight, LogOut, Menu, X } from 'lucide-react';
import * as React from 'react';

import { userAdmin } from '@/lib/auth';

export type ScopedNavItem = {
    label: string;
    to: string;
    icon: React.ElementType;
    /** Si `true`, l'item n'est actif que sur l'égalité stricte (sinon `startsWith`). */
    exact?: boolean;
};

export type ScopedAppShellProps = {
    /** Logo affiché dans la sidebar et le mobile topbar. */
    brandIcon: React.ElementType;
    brandLabel: string;
    /** Sous-titre du logo (ex. "Administration", "Espace coach"). */
    brandEyebrow: string;
    /** Initiale affichée dans l'avatar mobile. */
    avatarInitial: string;
    nav: ScopedNavItem[];
    /** TopBar desktop optionnelle (titre + recherche globale, etc.). */
    desktopTopBar?: React.ReactNode;
    children: React.ReactNode;
};

function isActive(item: ScopedNavItem, pathname: string): boolean {
    if (item.exact) return pathname === item.to || pathname === `${item.to}/`;
    return pathname.startsWith(item.to);
}

type BrandMarkProps = Pick<ScopedAppShellProps, 'brandIcon' | 'brandLabel' | 'brandEyebrow'>;

function BrandMark({ brandIcon: Icon, brandLabel, brandEyebrow }: BrandMarkProps) {
    return (
        <Stack direction="row" spacing={1.4} alignItems="center" sx={{ px: 0.5 }}>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 10px 25px rgba(15,24,152,0.18)',
                }}
            >
                <Icon size={18} />
            </Box>
            <Box>
                <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
                    {brandLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {brandEyebrow}
                </Typography>
            </Box>
        </Stack>
    );
}

type SidebarProps = BrandMarkProps & { nav: ScopedNavItem[]; pathname: string; onLogout: () => void };

function Sidebar({ nav, pathname, onLogout, ...brand }: SidebarProps) {
    return (
        <Box
            component="aside"
            sx={{
                width: 280,
                flexShrink: 0,
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderRightColor: 'border',
                px: 2.5,
                py: 3,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden',
            }}
        >
            <BrandMark {...brand} />
            <Stack spacing={1} sx={{ mt: 4 }}>
                {nav.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item, pathname);
                    return (
                        <Button
                            key={item.label}
                            component={Link}
                            to={item.to}
                            preload="intent"
                            fullWidth
                            variant={active ? 'contained' : 'text'}
                            startIcon={<Icon size={16} />}
                            endIcon={active ? <ChevronRight size={16} /> : undefined}
                            sx={{
                                justifyContent: 'flex-start',
                                borderRadius: 4,
                                py: 1.35,
                                px: 2,
                                bgcolor: active ? 'primary.main' : 'transparent',
                                color: active ? '#fff' : 'text.secondary',
                                boxShadow: active ? '0 10px 25px rgba(15,24,152,0.16)' : 'none',
                                '&:hover': {
                                    bgcolor: active ? 'rgb(10,18,130)' : 'rgba(15,23,42,0.04)',
                                },
                            }}
                        >
                            {item.label}
                        </Button>
                    );
                })}
            </Stack>

            <Box sx={{ mt: 'auto' }}>
                <Button
                    onClick={onLogout}
                    fullWidth
                    variant="text"
                    startIcon={<LogOut size={16} />}
                    sx={{
                        justifyContent: 'flex-start',
                        borderRadius: 4,
                        py: 1.35,
                        px: 2,
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: 'rgb(220,38,38)' },
                    }}
                >
                    Déconnexion
                </Button>
            </Box>
        </Box>
    );
}

type MobileTopBarProps = BrandMarkProps & {
    nav: ScopedNavItem[];
    pathname: string;
    onLogout: () => void;
    avatarInitial: string;
};

function MobileTopBar({ nav, pathname, onLogout, avatarInitial, ...brand }: MobileTopBarProps) {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const Icon = brand.brandIcon;

    const closeDrawer = () => setDrawerOpen(false);

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    bgcolor: 'rgba(248,250,252,0.92)',
                    backdropFilter: 'blur(10px)',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderBottomColor: 'border',
                }}
            >
                <Toolbar sx={{ minHeight: 68, px: 2 }}>
                    <IconButton
                        onClick={() => setDrawerOpen(true)}
                        sx={{ mr: 1, color: 'text.primary' }}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={22} />
                    </IconButton>

                    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                color: '#fff',
                                display: 'grid',
                                placeItems: 'center',
                            }}
                        >
                            <Icon size={16} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} lineHeight={1.1}>
                                {brand.brandLabel}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {brand.brandEyebrow}
                            </Typography>
                        </Box>
                    </Stack>

                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>{avatarInitial}</Avatar>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={closeDrawer}
                slotProps={{ paper: { sx: { width: 280, bgcolor: 'background.paper' } } }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2.5 }}>
                    <BrandMark {...brand} />
                    <IconButton onClick={closeDrawer} size="small" aria-label="Fermer le menu">
                        <X size={18} />
                    </IconButton>
                </Stack>

                <List sx={{ px: 1.5, flex: 1 }}>
                    {nav.map(item => {
                        const NavIcon = item.icon;
                        const active = isActive(item, pathname);
                        return (
                            <ListItemButton
                                key={item.label}
                                component={Link}
                                to={item.to}
                                onClick={closeDrawer}
                                sx={{
                                    borderRadius: 3,
                                    mb: 0.5,
                                    bgcolor: active ? 'primary.main' : 'transparent',
                                    color: active ? '#fff' : 'text.secondary',
                                    '&:hover': { bgcolor: active ? 'rgb(10,18,130)' : 'rgba(15,23,42,0.04)' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                                    <NavIcon size={18} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    slotProps={{ primary: { fontWeight: active ? 700 : 600, fontSize: '0.9rem' } }}
                                />
                                {active && <ChevronRight size={16} />}
                            </ListItemButton>
                        );
                    })}
                </List>

                <Divider />
                <List sx={{ px: 1.5, py: 1 }}>
                    <ListItemButton
                        onClick={() => {
                            closeDrawer();
                            onLogout();
                        }}
                        sx={{
                            borderRadius: 3,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: 'rgb(220,38,38)' },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                            <LogOut size={18} />
                        </ListItemIcon>
                        <ListItemText
                            primary="Déconnexion"
                            slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' } }}
                        />
                    </ListItemButton>
                </List>
            </Drawer>
        </>
    );
}

/**
 * Coque applicative partagée par les espaces admin et coach (sidebar + topbar mobile + zone main).
 * Avant cette factorisation, `routes/admin/route.tsx` et `routes/coach/route.tsx` répliquaient
 * presque ligne pour ligne le BrandMark, la sidebar, le drawer mobile et le bouton de logout.
 */
export function ScopedAppShell({
    brandIcon,
    brandLabel,
    brandEyebrow,
    avatarInitial,
    nav,
    desktopTopBar,
    children,
}: ScopedAppShellProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        userAdmin.removeToken();
        navigate({ to: '/admin/login' });
    };

    const brand = { brandIcon, brandLabel, brandEyebrow };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <MobileTopBar
                {...brand}
                nav={nav}
                pathname={location.pathname}
                onLogout={handleLogout}
                avatarInitial={avatarInitial}
            />
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar {...brand} nav={nav} pathname={location.pathname} onLogout={handleLogout} />
                <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 } }}>
                    {desktopTopBar}
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
