import { AdminLayout } from '@/components/layout/AdminLayout';
import { userAdmin } from '@/lib/auth';
import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
    beforeLoad: ({ location }) => {
        // Redirection sécurisée si l'utilisateur n'est pas authentifié (sauf s'il est déjà sur /login)
        if (!userAdmin.isAuthenticated() && location.pathname !== '/admin/login') {
            throw redirect({ to: '/admin/login' });
        }
    },
    component: AdminRouteComponent,
});

function AdminRouteComponent() {
    const location = useLocation();

    // La page login utilise le RootLayout mais ne doit pas inclure la sidebar (AdminLayout)
    if (location.pathname === '/admin/login') {
        return <Outlet />;
    }

    // Pour toutes les autres routes /admin/*, on applique le layout complet
    return <AdminLayout />;
}
