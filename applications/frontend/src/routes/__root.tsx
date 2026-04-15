import { Navbar } from '@/components/layout/Navbar';
import { Box } from '@mui/material';
import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Navbar />
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </Box>
        </Box>
    );
}
