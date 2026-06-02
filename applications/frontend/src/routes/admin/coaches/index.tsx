import { CoachesListPage } from '@/components/scoped/CoachesListPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/coaches/')({
    component: CoachesListPage,
});
