import { userParticipant } from '@/lib/auth';
import { AppBar, Box, Button, Divider, Stack, Toolbar, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link, useLocation } from '@tanstack/react-router';
import { BarChart2, LogIn } from 'lucide-react';

export function Navbar() {
    const theme = useTheme();
    const location = useLocation();
    const isAdminArea = location.pathname.startsWith('/admin');
    const isAuthPage = location.pathname === '/login' || location.pathname === '/forgot-password';
    const participantLoggedIn = userParticipant.isAuthenticated();

    const barIsAdmin = isAdminArea;
    const barFg = barIsAdmin ? theme.palette.info.contrastText : theme.palette.primary.contrastText;
    const barFgMuted = barIsAdmin ? 'rgba(26, 26, 46, 0.75)' : 'rgba(255, 255, 255, 0.85)';
    const barBorder = barIsAdmin ? 'rgba(26, 26, 46, 0.12)' : 'rgba(255, 255, 255, 0.1)';
    const dividerOnBar = barIsAdmin ? 'rgba(26, 26, 46, 0.2)' : 'rgba(255, 255, 255, 0.2)';

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: barIsAdmin ? 'info.main' : 'primary.main',
                borderBottom: '1px solid',
                borderColor: barBorder,
            }}
        >
            <Toolbar sx={{ px: { xs: 2, md: 4, lg: 6 }, height: 64, gap: 2 }}>
                {/* Logo et Marque */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Box
                        component="img"
                        src="/aor.png"
                        alt="Logo Révéla"
                        sx={{
                            height: 36, // Légèrement affiné pour s'intégrer parfaitement dans les 64px
                            width: 'auto',
                            borderRadius: 1,
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { transform: 'scale(1.03)' },
                        }}
                    />
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
                        <Divider orientation="vertical" flexItem sx={{ bgcolor: dividerOnBar, my: 1.5 }} />
                        <Typography variant="subtitle2" sx={{ color: barFg, fontWeight: 700, letterSpacing: 0.5 }}>
                            Plateforme Révéla
                        </Typography>
                    </Box>
                </Link>

                <Box sx={{ flex: 1 }} />

                {/* Actions Utilisateur / Admin */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {!isAdminArea && !isAuthPage && !participantLoggedIn && (
                        <Button
                            component={Link}
                            to="/login"
                            startIcon={<LogIn size={16} strokeWidth={2.5} />}
                            disableRipple
                            sx={{
                                color: theme.palette.primary.contrastText,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                px: 2.5,
                                py: 0.75,
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                            }}
                        >
                            Connexion
                        </Button>
                    )}

                    {/* Bouton d'accès rapide Admin */}
                    <Button
                        component={Link}
                        to="/admin"
                        startIcon={<BarChart2 size={16} strokeWidth={2.5} />}
                        disableRipple
                        sx={{
                            color: barIsAdmin ? 'primary.main' : barFgMuted,
                            bgcolor: barIsAdmin ? 'rgba(15, 24, 152, 0.12)' : 'transparent',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            px: 2.5,
                            py: 0.75,
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                                color: barIsAdmin ? 'primary.dark' : theme.palette.primary.contrastText,
                                bgcolor: barIsAdmin ? 'rgba(15, 24, 152, 0.18)' : 'rgba(255,255,255,0.1)',
                            },
                        }}
                    >
                        Analytics
                    </Button>
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
