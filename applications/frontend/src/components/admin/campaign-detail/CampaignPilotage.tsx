// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Card, CardContent, Stack } from '@mui/material';
import { ClipboardList, Sparkles, UserRound } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';

import { MiniLine } from './MiniLine';

export type CampaignPilotageProps = {
    questionnaireLabel: string;
    coachName: string;
    companyName: string;
};

export function CampaignPilotage({ questionnaireLabel, coachName, companyName }: CampaignPilotageProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Pilotage" subtitle="Quelques repères utiles." />
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                    <MiniLine label="Questionnaire" value={questionnaireLabel} icon={ClipboardList} />
                    <MiniLine label="Coach" value={coachName} icon={UserRound} />
                    <MiniLine label="Entreprise" value={companyName} icon={Sparkles} />
                </Stack>
            </CardContent>
        </Card>
    );
}
