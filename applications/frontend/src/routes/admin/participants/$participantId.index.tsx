// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantDetailView } from '@/components/admin/participant-detail/ParticipantDetailView';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/participants/$participantId/')({
    component: AdminParticipantDetailRoute,
});

function AdminParticipantDetailRoute() {
    const { participantId } = Route.useParams();
    return <ParticipantDetailView participantId={Number(participantId)} scopePrefix="/admin" />;
}
