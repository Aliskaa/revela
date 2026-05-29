// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { LegacyParticipantDetailRedirect } from '@/components/admin/participant-detail/LegacyParticipantDetailRedirect';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/coach/participants/$participantId/')({
    component: CoachLegacyParticipantDetailRedirect,
});

function CoachLegacyParticipantDetailRedirect() {
    const { participantId } = Route.useParams();
    return <LegacyParticipantDetailRedirect participantId={Number(participantId)} scope="coach" />;
}
