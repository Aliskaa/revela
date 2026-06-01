// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AppBar, Avatar, Box, Drawer, IconButton, Stack, type SxProps, type Theme, Toolbar, Typography, useTheme } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Bell, ChevronRight, LineChart, LogOut, Menu, Settings, X } from 'lucide-react';
import * as React from 'react';

import { useAppShellChrome } from '@/components/layout/AppShellChromeContext';
import type { ScopedNavItem } from '@/components/layout/ScopedAppShell';

export const APP_SHELL_SIDEBAR_WIDTH = 288;
export const APP_SHELL_CONTENT_MAX_WIDTH = 1600;

const SIDEBAR_SX = {
    width: APP_SHELL_SIDEBAR_WIDTH,
    flexShrink: 0,
    display: { xs: 'none', lg: 'flex' },
    flexDirection: 'column',
    bgcolor: 'primary.main',
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
    py: 4,
    boxShadow: (theme: Theme) => theme.palette.shadow.sidebar,
    overflow: 'hidden',
} as const;

type AppShellBrandMarkProps = {
    brandLabel: string;
    brandEyebrow: string;
    onDark?: boolean;
};

export function AppShellBrandMark({ brandLabel, brandEyebrow, onDark = true }: AppShellBrandMarkProps) {
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
                    boxShadow: theme => theme.palette.shadow.secondaryGlowSm,
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
                        color: onDark ? 'surface.softWhite' : 'text.primary',
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

type AppShellNavLinkProps = {
    item: ScopedNavItem;
    active: boolean;
    onClick?: () => void;
};

function AppShellNavLink({ item, active, onClick }: AppShellNavLinkProps) {
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
                color: active ? 'secondary.main' : 'tint.onDarkMuted',
                bgcolor: active ? 'tint.onPrimarySurface' : 'transparent',
                borderRadius: active ? '0 999px 999px 0' : 2,
                boxShadow: active ? (theme => theme.palette.shadow.navActive) : 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                    color: active ? 'secondary.main' : 'surface.softWhite',
                    bgcolor: active ? 'tint.onPrimarySurface' : 'tint.onPrimarySurfaceFaint',
                    transform: active ? 'none' : 'translateX(4px)',
                },
            }}
        >
            <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            {item.label}
        </Box>
    );
}

type AppShellSidebarProps = {
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

export function AppShellSidebar({
    brandLabel,
    brandEyebrow,
    nav,
    footerNav,
    pathname,
    onLogout,
}: AppShellSidebarProps) {
    return (
        <Box component="aside" sx={SIDEBAR_SX}>
            <Box sx={{ mb: 5 }}>
                <AppShellBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} />
            </Box>

            <Box component="nav" sx={{ flex: 1, px: 1 }}>
                <Stack spacing={0.5}>
                    {nav.map(item => (
                        <AppShellNavLink key={item.label} item={item} active={isActive(item, pathname)} />
                    ))}
                </Stack>
            </Box>

            <Box sx={{ px: 1, mt: 'auto' }}>
                <Box sx={{ height: '1px', bgcolor: 'tint.onPrimarySurface', mx: 3, mb: 3 }} />
                {footerNav.map(item => (
                    <AppShellNavLink key={item.label} item={item} active={isActive(item, pathname)} />
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
                        color: 'tint.onDarkDangerText',
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        fontFamily: 'inherit',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            bgcolor: 'tint.dangerHover',
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

export type AppShellUserAvatarProps = {
    src?: string | null;
    initials: string;
    alt?: string;
    size?: number;
    sx?: SxProps<Theme>;
};

export function AppShellUserAvatar({ src, initials, alt, size = 50, sx }: AppShellUserAvatarProps) {
    return (
        <Avatar
            src={src ?? undefined}
            alt={alt ?? initials}
            sx={{
                width: size,
                height: size,
                bgcolor: 'primary.main',
                fontWeight: 700,
                fontSize: size <= 36 ? '0.875rem' : '1rem',
                letterSpacing: '0.04em',
                ...sx,
            }}
        >
            {initials}
        </Avatar>
    );
}

type AppShellTopBarProps = {
    userAvatar: AppShellUserAvatarProps;
};

export function AppShellTopBar({ userAvatar }: AppShellTopBarProps) {
    const { breadcrumbs } = useAppShellChrome();
    const theme = useTheme();

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
                bgcolor: 'surface.footerWash',
                backdropFilter: 'blur(12px)',
                boxShadow: theme => theme.palette.shadow.topbar,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                {breadcrumbs.map((segment, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <React.Fragment key={`${segment.label}-${index}`}>
                            {index > 0 ? (
                                <ChevronRight size={14} color={theme.palette.tint.iconMutedFaint} aria-hidden />
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
                    {/* <IconButton
                        aria-label="Notifications"
                        sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'surface.lavenderGrey' },
                        }}
                    >
                        <Bell size={22} />
                    </IconButton>
                    <IconButton
                        aria-label="Paramètres"
                        sx={{
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'surface.lavenderGrey' },
                        }}
                    >
                        <Settings size={22} />
                    </IconButton> */}
                </Stack>
                <AppShellUserAvatar
                    {...userAvatar}
                    sx={{
                        border: '2px solid',
                        borderColor: 'surface.softWhite',
                        boxShadow: theme => theme.palette.shadow.cardSoft,
                        ...userAvatar.sx,
                    }}
                />
            </Stack>
        </Box>
    );
}

type AppShellMobileChromeProps = AppShellSidebarProps & {
    userAvatar: AppShellUserAvatarProps;
};

export function AppShellMobileChrome({
    brandLabel,
    brandEyebrow,
    nav,
    footerNav,
    pathname,
    onLogout,
    userAvatar,
}: AppShellMobileChromeProps) {
    const [open, setOpen] = React.useState(false);
    const close = () => setOpen(false);

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    bgcolor: 'surface.drawerWash',
                    backdropFilter: 'blur(12px)',
                    color: 'text.primary',
                    boxShadow: theme => theme.palette.shadow.topbar,
                }}
            >
                <Toolbar sx={{ minHeight: 64, px: 2 }}>
                    <IconButton onClick={() => setOpen(true)} aria-label="Ouvrir le menu" sx={{ mr: 1 }}>
                        <Menu size={22} />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <AppShellBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} onDark={false} />
                    </Box>
                    <AppShellUserAvatar {...userAvatar} size={36} />
                </Toolbar>
            </AppBar>

            <Drawer
                anchor="left"
                open={open}
                onClose={close}
                slotProps={{
                    paper: {
                        sx: {
                            width: APP_SHELL_SIDEBAR_WIDTH,
                            bgcolor: 'primary.main',
                            color: 'surface.softWhite',
                        },
                    },
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ px: 2, pt: 3, pb: 1 }}>
                    <AppShellBrandMark brandLabel={brandLabel} brandEyebrow={brandEyebrow} />
                    <IconButton onClick={close} aria-label="Fermer le menu" sx={{ color: 'tint.onPrimaryIcon' }}>
                        <X size={20} />
                    </IconButton>
                </Stack>
                <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                    {nav.map(item => (
                        <AppShellNavLink
                            key={item.label}
                            item={item}
                            active={isActive(item, pathname)}
                            onClick={close}
                        />
                    ))}
                </Box>
                <Box sx={{ pb: 3 }}>
                    <Box sx={{ height: '1px', bgcolor: 'tint.onPrimarySurface', mx: 4, mb: 2 }} />
                    {footerNav.map(item => (
                        <AppShellNavLink
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
                            color: 'tint.onDarkDangerText',
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
