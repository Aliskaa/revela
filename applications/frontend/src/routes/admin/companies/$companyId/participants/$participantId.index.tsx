// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { ParticipantDetailPage } from '@/components/scoped/ParticipantDetailPage';

export const Route = createFileRoute('/admin/companies/$companyId/participants/$participantId/')({
    component: AdminCompanyParticipantDetailRoute,
});

function AdminCompanyParticipantDetailRoute() {
    const { participantId } = Route.useParams();
    return <ParticipantDetailPage scope="admin" participantId={Number(participantId)} />;
}
