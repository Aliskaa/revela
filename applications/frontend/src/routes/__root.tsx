import { theme } from '@/lib/theme';
import { Box, Button, Card, CardContent, CssBaseline, Stack, ThemeProvider, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { AlertTriangle, Compass, RotateCcw } from 'lucide-react';
import type * as React from 'react';

export type RouterContext = Record<string, never>;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
        },
        mutations: {
            retry: 0,
        },
    },
});

function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                p: 3,
                bgcolor: 'background.default',
            }}
        >
            <Card variant="outlined" sx={{ maxWidth: 560, width: '100%' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>{children}</CardContent>
            </Card>
        </Box>
    );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
    if (typeof console !== 'undefined') {
        console.error('Router error boundary caught:', error);
    }
    const message = error.message || 'Une erreur inattendue est survenue.';
    return (
        <RootProviders>
            <CenteredScreen>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 4,
                            bgcolor: 'tint.primaryBg',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <AlertTriangle size={24} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Une erreur est survenue
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                            {message}
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<RotateCcw size={16} />}
                            onClick={reset}
                            sx={{ borderRadius: 3, textTransform: 'none' }}
                        >
                            Réessayer
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                window.location.href = '/';
                            }}
                            sx={{ borderRadius: 3, textTransform: 'none' }}
                        >
                            Retour à l'accueil
                        </Button>
                    </Stack>
                </Stack>
            </CenteredScreen>
        </RootProviders>
    );
}

function NotFoundComponent() {
    return (
        <RootProviders>
            <CenteredScreen>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 4,
                            bgcolor: 'tint.secondaryBg',
                            color: 'tint.secondaryText',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <Compass size={24} />
                    </Box>
                    <Box>
                        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
                            404
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Page introuvable
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                            L'URL demandée n'existe pas ou n'est plus disponible.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.2}>
                        <Button
                            component={Link}
                            to="/"
                            variant="contained"
                            disableElevation
                            sx={{ borderRadius: 3, textTransform: 'none' }}
                        >
                            Retour à l'accueil
                        </Button>
                    </Stack>
                </Stack>
            </CenteredScreen>
        </RootProviders>
    );
}

function RootComponent() {
    return (
        <RootProviders>
            <Outlet />
        </RootProviders>
    );
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
    errorComponent: RootErrorComponent,
    notFoundComponent: NotFoundComponent,
});
