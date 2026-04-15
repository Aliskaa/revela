import { SIDEBAR_WIDTH } from '@/components/layout/LayoutSidebar';
import { Box, Drawer, IconButton, Typography } from '@mui/material';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';

type ResponsiveSidebarLayoutProps = {
    mobileOpen: boolean;
    onToggleMobileDrawer: () => void;
    mobileTitle: string;
    sidebarContent: ReactNode;
    children: ReactNode;
};

export const ResponsiveSidebarLayout = ({
    mobileOpen,
    onToggleMobileDrawer,
    mobileTitle,
    sidebarContent,
    children,
}: ResponsiveSidebarLayoutProps) => {
    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onToggleMobileDrawer}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: SIDEBAR_WIDTH,
                        bgcolor: 'background.paper',
                        borderRight: 'none',
                        boxShadow: '4px 0 24px rgba(0,0,0,0.05)',
                    },
                }}
            >
                {sidebarContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        top: 64,
                        height: 'calc(100vh - 64px)',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    },
                }}
            >
                {sidebarContent}
            </Drawer>

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                    overflow: 'hidden',
                    bgcolor: 'background.default',
                }}
            >
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        alignItems: 'center',
                        p: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <IconButton edge="start" onClick={onToggleMobileDrawer} sx={{ mr: 1.5, color: 'text.secondary' }}>
                        <Menu size={20} />
                    </IconButton>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main" letterSpacing={-0.5}>
                        {mobileTitle}
                    </Typography>
                </Box>

                {children}
            </Box>
        </Box>
    );
};
