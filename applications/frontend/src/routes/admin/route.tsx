import { userAdmin } from '@/lib/auth';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    InputBase,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { Link, Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import {
    Building2,
    ChevronRight,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquareText,
    Search,
    Shield,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react';
import * as React from 'react';

type AdminNavItem = {
    label: string;
    to: string;
    icon: React.ElementType;
    exact?: boolean;
};

const navItems: AdminNavItem[] = [
    { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Campagnes', to: '/admin/campaigns', icon: ClipboardList },
    { label: 'Entreprises', to: '/admin/companies', icon: Building2 },
    { label: 'Coachs', to: '/admin/coaches', icon: UserRound },
    { label: 'Réponses', to: '/admin/responses', icon: MessageSquareText },
    { label: 'Questionnaires', to: '/admin/questionnaires', icon: Sparkles },
];

function isActive(item: AdminNavItem, pathname: string): boolean {
    if (item.exact) return pathname === item.to || pathname === `${item.to}/`;
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
                <Shield size={18} />
            </Box>
            <Box>
                <Typography fontWeight={800} color="text.primary" lineHeight={1.1}>
                    Révéla
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Administration
                </Typography>
            </Box>
        </Stack>
    );
}

function AdminSidebar() {
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
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderRightColor: 'border',
                px: 2.5,
                py: 3,
            }}
        >
            <BrandMark />

            <Stack spacing={1} sx={{ mt: 4 }}>
                {navItems.map(item => {
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
                            <Shield size={16} />
                        </Box>
                        <Box>
                            <Typography fontWeight={800} lineHeight={1.1}>
                                Révéla
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Administration
                            </Typography>
                        </Box>
                    </Stack>

                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>A</Avatar>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 280, bgcolor: 'background.paper' } }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2.5 }}>
                    <BrandMark />
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Fermer le menu">
                        <X size={18} />
                    </IconButton>
                </Stack>

                <List sx={{ px: 1.5, flex: 1 }}>
                    {navItems.map(item => {
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
                                    slotProps={{ primary: { fontWeight: active ? 700 : 500, fontSize: '0.9rem' } }}
                                />
                                {active && <ChevronRight size={16} />}
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

function TopBar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        userAdmin.removeToken();
        navigate({ to: '/admin/login' });
    };

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

            <Stack direction="row" spacing={1.5} alignItems="center">
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

                <IconButton
                    onClick={handleLogout}
                    aria-label="Se déconnecter"
                    sx={{ border: '1px solid', borderColor: 'border', bgcolor: 'background.paper' }}
                >
                    <LogOut size={18} />
                </IconButton>
            </Stack>
        </Stack>
    );
}

function AdminShell({ children }: { children: React.ReactNode }) {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <MobileTopBar />
            <Box sx={{ display: 'flex', minHeight: '100vh', maxWidth: 1600, mx: 'auto' }}>
                <AdminSidebar />

                <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 } }}>
                    <TopBar />
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

function AdminRoot() {
    const location = useLocation();
    const isLogin = location.pathname === '/admin/login';

    if (isLogin) return <Outlet />;

    return (
        <AdminShell>
            <Outlet />
        </AdminShell>
    );
}

export const Route = createFileRoute('/admin')({
    /**
     * Garde route-level : redirige les non-authentifiés vers `/admin/login` AVANT que la
     * chrome admin (sidebar, drawer, navbar) ne soit montée. Évite le flash visuel + le 401
     * silencieux côté API. Skip pour `/admin/login` lui-même afin d'éviter une boucle.
     */
    beforeLoad: ({ location }) => {
        if (location.pathname === '/admin/login') {
            return;
        }
        if (!userAdmin.isAuthenticated()) {
            throw redirect({ to: '/admin/login' });
        }
    },
    component: AdminRoot,
});
