import { LayoutSidebar } from '@/components/layout/LayoutSidebar';
import { userParticipant } from '@/lib/auth';
import { Box } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Compass, LayoutDashboard } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { FooterLayout } from './FooterLayout';
import { ResponsiveSidebarLayout } from './ResponsiveSidebarLayout';

export type RevelaNavId = 'journey' | 'results' | 'resources';

const NAV_ITEMS: ParticipantNavItem[] = [
    { id: 'journey', icon: <Compass size={20} />, label: 'Mon parcours' },
    { id: 'results', icon: <LayoutDashboard size={20} />, label: 'Mes résultats' },
    { id: 'resources', icon: <BookOpen size={20} />, label: 'Ressources' },
];

type ParticipantLayoutProps = {
    children: ReactNode;
    activeNav: RevelaNavId;
    headerTitle: string;
    headerSubtitle?: string;
    stepLine?: string;
    stepHighlight?: string;
    topRightNote?: string;
};

type ParticipantNavItem = {
    id: RevelaNavId;
    icon: ReactNode;
    label: string;
};

export function ParticipantLayout({ children, activeNav }: ParticipantLayoutProps) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const goHome = () => navigate({ to: '/participant' });
    const goHash = (hash: string) => {
        void navigate({ to: '/participant', hash });
        queueMicrotask(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const handleNavClick = (id: RevelaNavId) => {
        if (id === 'journey') {
            goHome();
            return;
        }
        if (id === 'results') {
            goHash('synthese');
            return;
        }
        goHash('ressources');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const sidebarItems = NAV_ITEMS.map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        active: activeNav === item.id,
        onClick: () => {
            handleNavClick(item.id);
            setMobileOpen(false);
        },
    }));
    function handleLogout() {
        userParticipant.removeToken();
        navigate({ to: '/login' });
    }

    const drawerContent = <LayoutSidebar subtitle="Participant" items={sidebarItems} onLogout={handleLogout} />;

    return (
        <ResponsiveSidebarLayout
            mobileOpen={mobileOpen}
            onToggleMobileDrawer={handleDrawerToggle}
            mobileTitle="Mon parcours"
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
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        px: { xs: 2, md: 4 },
                        py: { xs: 3, md: 4 },
                    }}
                >
                    {children}
                </Box>

                <FooterLayout />
            </Box>
        </ResponsiveSidebarLayout>
    );
}
