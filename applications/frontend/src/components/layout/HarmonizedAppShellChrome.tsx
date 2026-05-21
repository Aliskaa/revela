// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    AppBar,
    Avatar,
    Box,
    Drawer,
    IconButton,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronRight, LineChart, LogOut, Menu, Settings, X } from 'lucide-react';
import * as React from 'react';

import type { ScopedNavItem } from '@/components/layout/ScopedAppShell';
import { useHarmonizedChrome } from '@/components/layout/HarmonizedChromeContext';

export const HARMONIZED_SIDEBAR_WIDTH = 288;

const SIDEBAR_SX = {
    width: HARMONIZED_SIDEBAR_WIDTH,
    flexShrink: 0,
    display: { xs: 'none', lg: 'flex' },
    flexDirection: 'column',
    bgcolor: 'primary.main',
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    zIndex: theme => theme.zIndex.drawer + 1,
    py: 4,
    boxShadow: '0 25px 50px -12px rgba(15, 24, 152, 0.25)',
    overflow: 'hidden',
} as const;

type HarmonizedBrandMarkProps = {
    brandLabel: string;
    brandEyebrow: string;
    onDark?: boolean;
};

export function HarmonizedBrandMark({ brandLabel, brandEyebrow, onDark = true }: HarmonizedBrandMarkProps) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: onDark ? 4 : 0.5 }}>
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 10px 15px -3px rgba(255, 204, 0, 0.3)',
                    flexShrink: 0,
                }}
            >
                <LineChart size={22} strokeWidth={2.25} aria-hidden />
            </Box>
            <Box>
                <Typography
                    fontWeight={900}
                    lineHeight={1}
                    sx={{
                        color: onDark ? '#FAFAFA' : 'text.primary',
                        fontSize: '1.25rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    {brandLabel}
                </Typography>
                <Typography
                    sx={{
                        color: onDark ? 'secondary.main' : 'text.secondary',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        mt: 0.35,
                    }}
                >
                    {brandEyebrow}
                </Typography>
            </Box>
        </Stack>
    );
}

type HarmonizedNavLinkProps = {
    item: ScopedNavItem;
    active: boolean;
    onClick?: () => void;
};

function HarmonizedNavLink({ item, active, onClick }: HarmonizedNavLinkProps) {
    const Icon = item.icon;
    return (
        <Box
            component={Link}
            to={item.to}
            preload="intent"
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 2,
                mx: 1,
                textDecoration: 'none',
                color: active ? 'secondary.main' : 'rgba(250, 250, 250, 0.7)',
                bgcolor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderRadius: active ? '0 999px 999px 0' : 2,
                boxShadow: active ? '4px 0 12px rgba(255, 204, 0, 0.2)' : 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                    color: active ? 'secondary.main' : '#FAFAFA',
                    bgcolor: active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    transform: active ? 'none' : 'translateX(4px)',
                },
            }}
        >
            <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            {item.label}
        </Box>
    );
}

type HarmonizedSidebarProps = {
    brandLabel: string;
    brandEyebrow: string;
    nav: ScopedNavItem[];
    footerNav: ScopedNavItem[];
    pathname: string;
    onLogout: () => void;
};

function isActive(item: ScopedNavItem, pathname: string): boolean {
    if (item.exact) return pathname === item.to || pathname === `${item.to}/`;
    return pathname.startsWith(item.to);
}

export function HarmonizedSidebar({ brandLabel, brandEyebrow, nav, footerNav, pathname, onLogout }: HarmonizedSidebarProps) {
    return (
        <Box component="aside" sx={SIDEBAR_SX}>
            <Box sx={{ mb: 5 }}>
                <HarmonizedBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} />
            </Box>

            <Box component="nav" sx={{ flex: 1, px: 1 }}>
                <Stack spacing={0.5}>
                    {nav.map(item => (
                        <HarmonizedNavLink key={item.label} item={item} active={isActive(item, pathname)} />
                    ))}
                </Stack>
            </Box>

            <Box sx={{ px: 1, mt: 'auto' }}>
                <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: 3, mb: 3 }} />
                {footerNav.map(item => (
                    <HarmonizedNavLink key={item.label} item={item} active={isActive(item, pathname)} />
                ))}
                <Box
                    component="button"
                    type="button"
                    onClick={onLogout}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: 'calc(100% - 16px)',
                        mx: 1,
                        px: 3,
                        py: 2,
                        border: 'none',
                        cursor: 'pointer',
                        bgcolor: 'transparent',
                        color: 'rgba(239, 68, 68, 0.85)',
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                            color: 'error.main',
                        },
                    }}
                >
                    <LogOut size={22} aria-hidden />
                    Déconnexion
                </Box>
            </Box>
        </Box>
    );
}

type HarmonizedDesktopTopBarProps = {
    avatarInitial: string;
};

export function HarmonizedDesktopTopBar({ avatarInitial }: HarmonizedDesktopTopBarProps) {
    const { breadcrumbs } = useHarmonizedChrome();

    return (
        <Box
            component="header"
            sx={{
                display: { xs: 'none', lg: 'flex' },
                position: 'sticky',
                top: 0,
                zIndex: theme => theme.zIndex.appBar,
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 5,
                py: 2,
                bgcolor: 'rgba(250, 250, 250, 0.8)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 6px -1px rgba(15, 24, 152, 0.05)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                {breadcrumbs.map((segment, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <React.Fragment key={`${segment.label}-${index}`}>
                            {index > 0 ? (
                                <ChevronRight size={14} color="rgba(107, 114, 128, 0.6)" aria-hidden />
                            ) : null}
                            {segment.to && !isLast ? (
                                <Typography
                                    component={Link}
                                    to={segment.to}
                                    sx={{
                                        color: 'text.secondary',
                                        opacity: 0.65,
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        textDecoration: 'none',
                                        '&:hover': { color: 'primary.main', opacity: 1 },
                                    }}
                                >
                                    {segment.label}
                                </Typography>
                            ) : (
                                <Typography
                                    sx={{
                                        color: isLast ? 'primary.main' : 'text.secondary',
                                        fontWeight: isLast ? 700 : 600,
                                        fontSize: '0.875rem',
                                        opacity: isLast ? 1 : 0.65,
                                    }}
                                >
                                    {segment.label}
                                </Typography>
                            )}
                        </React.Fragment>
                    );
                })}
            </Box>

            <Stack direction="row" alignItems="center" spacing={3}>
                <Stack direction="row" spacing={0.5}>
                    <IconButton
                        aria-label="Notifications"
                        sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: '#F5F5FB' },
                        }}
                    >
                        <Bell size={22} />
                    </IconButton>
                    <IconButton
                        aria-label="Paramètres"
                        sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: '#F5F5FB' },
                        }}
                    >
                        <Settings size={22} />
                    </IconButton>
                </Stack>
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main',
                        border: '2px solid #FAFAFA',
                        boxShadow: theme => theme.palette.shadow.cardSoft,
                    }}
                >
                    {avatarInitial}
                </Avatar>
            </Stack>
        </Box>
    );
}

type HarmonizedMobileChromeProps = HarmonizedSidebarProps & {
    avatarInitial: string;
};

export function HarmonizedMobileChrome({
    brandLabel,
    brandEyebrow,
    nav,
    footerNav,
    pathname,
    onLogout,
    avatarInitial,
}: HarmonizedMobileChromeProps) {
    const [open, setOpen] = React.useState(false);
    const close = () => setOpen(false);

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    bgcolor: 'rgba(250, 250, 250, 0.92)',
                    backdropFilter: 'blur(12px)',
                    color: 'text.primary',
                    boxShadow: '0 4px 6px -1px rgba(15, 24, 152, 0.05)',
                }}
            >
                <Toolbar sx={{ minHeight: 64, px: 2 }}>
                    <IconButton onClick={() => setOpen(true)} aria-label="Ouvrir le menu" sx={{ mr: 1 }}>
                        <Menu size={22} />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <HarmonizedBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} onDark={false} />
                    </Box>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>{avatarInitial}</Avatar>
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={open}
                onClose={close}
                slotProps={{
                    paper: {
                        sx: {
                            width: HARMONIZED_SIDEBAR_WIDTH,
                            bgcolor: 'primary.main',
                            color: '#FAFAFA',
                        },
                    },
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ px: 2, pt: 3, pb: 1 }}>
                    <HarmonizedBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} />
                    <IconButton onClick={close} aria-label="Fermer le menu" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        <X size={20} />
                    </IconButton>
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                    {nav.map(item => (
                        <HarmonizedNavLink
                            key={item.label}
                            item={item}
                            active={isActive(item, pathname)}
                            onClick={close}
                        />
                    ))}
                </Box>
                <Box sx={{ pb: 3 }}>
                    <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.1)', mx: 4, mb: 2 }} />
                    {footerNav.map(item => (
                        <HarmonizedNavLink
                            key={item.label}
                            item={item}
                            active={isActive(item, pathname)}
                            onClick={close}
                        />
                    ))}
                    <Box
                        component="button"
                        type="button"
                        onClick={() => {
                            close();
                            onLogout();
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: 'calc(100% - 16px)',
                            mx: 1,
                            px: 3,
                            py: 2,
                            border: 'none',
                            cursor: 'pointer',
                            bgcolor: 'transparent',
                            color: 'rgba(239, 68, 68, 0.85)',
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            fontFamily: 'inherit',
                        }}
                    >
                        <LogOut size={22} aria-hidden />
                        Déconnexion
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
