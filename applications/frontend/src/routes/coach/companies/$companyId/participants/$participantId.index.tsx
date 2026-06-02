// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute } from '@tanstack/react-router';

import { ParticipantDetailPage } from '@/components/scoped/ParticipantDetailPage';

export const Route = createFileRoute('/coach/companies/$companyId/participants/$participantId/')({
    component: CoachCompanyParticipantDetailRoute,
});

function CoachCompanyParticipantDetailRoute() {
    const { participantId } = Route.useParams();
    return <ParticipantDetailPage scope="coach" participantId={Number(participantId)} />;
}
