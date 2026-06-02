import { CoachDetailView } from '@/components/admin/coach-detail/CoachDetailView';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/coaches/$coachId')({
    component: AdminCoachDetailRoute,
});

function AdminCoachDetailRoute() {
    const { coachId } = Route.useParams();
    return <CoachDetailView coachId={Number(coachId)} />;
}
