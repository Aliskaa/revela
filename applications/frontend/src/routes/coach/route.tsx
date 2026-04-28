// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { parseAdminJwtClaims, userAdmin } from '@/lib/auth';
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
import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { Building2, ChevronRight, ClipboardList, Gauge, LogOut, Menu, UserRound, Users, X } from 'lucide-react';
import * as React from 'react';

type CoachNavItem = {
    label: string;
    to: string;
    icon: React.ElementType;
    exact?: boolean;
};

const coachNav: CoachNavItem[] = [
    { label: 'Tableau de bord', to: '/coach', icon: Gauge, exact: true },
    { label: 'Mes campagnes', to: '/coach/campaigns', icon: ClipboardList },
    { label: 'Mes entreprises', to: '/coach/companies', icon: Building2 },
    { label: 'Mes participants', to: '/coach/participants', icon: Users },
];

function isActive(item: CoachNavItem, pathname: string): boolean {
    if (item.exact) {
        return pathname === item.to || pathname === `${item.to}/`;
    }
    return pathname.startsWith(item.to);
}

function BrandMark() {
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
                <UserRound size={18} />
            </Box>
            <Box>
                <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
                    Révéla
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Espace coach
                </Typography>
            </Box>
        </Stack>
    );
}

function CoachSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const handleLogout = () => {
        userAdmin.removeToken();
        navigate({ to: '/admin/login' });
    };

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
            <BrandMark />

            <Stack spacing={1} sx={{ mt: 4 }}>
                {coachNav.map(item => {
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
                    onClick={handleLogout}
                    fullWidth
                    variant="text"
                    startIcon={<LogOut size={16} />}
                    sx={{
                        justifyContent: 'flex-start',
                        borderRadius: 4,
                        py: 1.35,
                        px: 2,
                        color: 'text.secondary',
                        '&:hover': {
                            bgcolor: 'rgba(239,68,68,0.08)',
                            color: 'rgb(220,38,38)',
                        },
                    }}
                >
                    Déconnexion
                </Button>
            </Box>
        </Box>
    );
}

function MobileTopBar() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;

    const handleLogout = () => {
        userAdmin.removeToken();
        setDrawerOpen(false);
        navigate({ to: '/admin/login' });
    };

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
                            <UserRound size={16} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} lineHeight={1.1}>
                                Révéla
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Espace coach
                            </Typography>
                        </Box>
                    </Stack>

                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>C</Avatar>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                slotProps={{ paper: { sx: { width: 280, bgcolor: 'background.paper' } } }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2.5 }}>
                    <BrandMark />
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Fermer le menu">
                        <X size={18} />
                    </IconButton>
                </Stack>

                <List sx={{ px: 1.5, flex: 1 }}>
                    {coachNav.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item, pathname);
                        return (
                            <ListItemButton
                                key={item.label}
                                component={Link}
                                to={item.to}
                                onClick={() => setDrawerOpen(false)}
                                sx={{
                                    borderRadius: 3,
                                    mb: 0.5,
                                    bgcolor: active ? 'primary.main' : 'transparent',
                                    color: active ? '#fff' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: active ? 'rgb(10,18,130)' : 'rgba(15,23,42,0.04)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                                    <Icon size={18} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' } }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
                <Divider />
                <List sx={{ px: 1.5, py: 1 }}>
                    <ListItemButton
                        onClick={handleLogout}
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

function CoachShell({ children }: { children: React.ReactNode }) {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <MobileTopBar />
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <CoachSidebar />

                <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 } }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

function CoachRouteLayout() {
    return (
        <CoachShell>
            <Outlet />
        </CoachShell>
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
