// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantTransparencyPage } from '@/components/scoped/CampaignParticipantTransparencyPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId/participants/$participantId/transparency')({
    component: CoachCampaignParticipantTransparencyRoute,
});

function CoachCampaignParticipantTransparencyRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <CampaignParticipantTransparencyPage
                scope="coach"
                campaignId={Number(campaignId)}
                participantId={Number(participantId)}
            />
        </Box>
    );
}
