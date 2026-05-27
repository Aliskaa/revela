import { QuestionnairesListPage } from '@/components/scoped/QuestionnairesListPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/questionnaires')({
    component: QuestionnairesListPage,
});
