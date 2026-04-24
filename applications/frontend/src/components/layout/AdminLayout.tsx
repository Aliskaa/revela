import { LayoutSidebar } from '@/components/layout/LayoutSidebar';
import { userAdmin } from '@/lib/auth';
import { Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Building2, FileText, Flag, LayoutDashboard, Users } from 'lucide-react';
import { useState } from 'react';
import { FooterLayout } from './FooterLayout';
import { ResponsiveSidebarLayout } from './ResponsiveSidebarLayout';

const NAV_ITEMS = [
    { label: 'Tableau de bord', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Campagnes', path: '/admin/campaigns', icon: <Flag size={20} /> },
    { label: 'Réponses', path: '/admin/responses', icon: <FileText size={20} /> },
    { label: 'Participants', path: '/admin/participants', icon: <Users size={20} /> },
    { label: 'Entreprises', path: '/admin/companies', icon: <Building2 size={20} /> },
    { label: 'Coachs', path: '/admin/coachs', icon: <Users size={20} /> },
];

export function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    function handleLogout() {
        userAdmin.removeToken();
        navigate({ to: '/admin/login' });
    }

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const sidebarItems = NAV_ITEMS.map(item => ({
        id: item.path,
        label: item.label,
        icon: item.icon,
        active: location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)),
        onClick: () => {
            void navigate({ to: item.path });
            setMobileOpen(false);
        },
    }));

    const drawerContent = <LayoutSidebar subtitle="Administration" items={sidebarItems} onLogout={handleLogout} />;

    return (
        <ResponsiveSidebarLayout
            mobileOpen={mobileOpen}
            onToggleMobileDrawer={handleDrawerToggle}
            mobileTitle="Administration"
            sidebarContent={drawerContent}
        >
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
                <Box sx={{ flex: 1, overflowX: 'hidden', overflowY: 'auto' }}>
                    <Outlet />
                </Box>

                <FooterLayout />
            </Box>
        </ResponsiveSidebarLayout>
    );
}
