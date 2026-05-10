// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantAiRestitutionPage } from '@/components/scoped/CampaignParticipantAiRestitutionPage';

export const Route = createFileRoute('/coach/campaigns/$campaignId/participants/$participantId/ai-restitution')({
    component: CoachCampaignParticipantAiRestitutionRoute,
});

function CoachCampaignParticipantAiRestitutionRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <CampaignParticipantAiRestitutionPage
                scope="coach"
                campaignId={Number(campaignId)}
                participantId={Number(participantId)}
            />
        </Box>
    );
}
