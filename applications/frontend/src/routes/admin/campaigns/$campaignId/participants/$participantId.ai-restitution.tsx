// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';

import { CampaignParticipantAiRestitutionPage } from '@/components/scoped/CampaignParticipantAiRestitutionPage';

export const Route = createFileRoute('/admin/campaigns/$campaignId/participants/$participantId/ai-restitution')({
    component: AdminCampaignParticipantAiRestitutionRoute,
});

function AdminCampaignParticipantAiRestitutionRoute() {
    const { campaignId, participantId } = Route.useParams();
    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <CampaignParticipantAiRestitutionPage
                scope="admin"
                campaignId={Number(campaignId)}
                participantId={Number(participantId)}
            />
        </Box>
    );
}
