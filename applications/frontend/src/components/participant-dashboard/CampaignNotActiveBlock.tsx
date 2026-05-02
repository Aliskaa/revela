// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Button, Stack } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export type CampaignNotActiveBlockProps = {
    /** Campaign id pour proposer le bouton retour vers le workspace de la campagne. */
    campaignId?: number | null;
};

/**
 * Bloc d'erreur unifié à afficher dans les routes participant qui exigent une campagne
 * `status === 'active'` (self-rating, peer-feedback, test). Le backend rejette déjà la
 * soumission via `SubmitParticipantQuestionnaireUseCase`, ce composant évite juste
 * d'afficher des écrans qui plantent au submit pour un participant qui aurait l'URL.
 */
export function CampaignNotActiveBlock({ campaignId }: CampaignNotActiveBlockProps) {
    return (
        <Stack spacing={2}>
            <Alert severity="info" sx={{ borderRadius: 3 }}>
                Cette campagne n'est pas encore active. Vous pourrez accéder à cette étape dès qu'elle aura été lancée
                par votre coach.
            </Alert>
            {campaignId ? (
                <Link to="/campaigns/$campaignId" params={{ campaignId: String(campaignId) }}>
                    <Button
                        component="a"
                        startIcon={<ArrowLeft size={16} />}
                        variant="outlined"
                        sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                    >
                        Retour à la campagne
                    </Button>
                </Link>
            ) : (
                <Link to="/campaigns">
                    <Button
                        component="a"
                        startIcon={<ArrowLeft size={16} />}
                        variant="outlined"
                        sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                    >
                        Retour aux campagnes
                    </Button>
                </Link>
            )}
        </Stack>
    );
}
