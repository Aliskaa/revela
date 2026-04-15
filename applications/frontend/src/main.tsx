import { queryClient } from '@/lib/queryClient';
import { theme } from '@/lib/theme';
import { routeTree } from '@/routeTree.gen';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <RouterProvider router={router} />
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>
);
