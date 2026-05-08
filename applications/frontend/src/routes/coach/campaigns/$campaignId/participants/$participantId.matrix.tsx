// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { QuestionnaireMatrixDisplay } from '@/components/matrix/QuestionnaireMatrixDisplay';
import { useAdminCampaign, useParticipant, useParticipantQuestionnaireMatrix } from '@/hooks/admin';
import { Alert, Box, Button, Card, CircularProgress, Stack, Typography } from '@mui/material';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ArrowLeft, LayoutPanelLeft } from 'lucide-react';

/**
 * Matrice des scores d'un participant côté coach, scopée à une campagne.
 *
 * Réplique de `routes/admin/campaigns/$campaignId/participants/$participantId.matrix.tsx`.
 * Le `qid` est dérivé du `questionnaireId` de la campagne (pattern aligné sur
 * `_participant/campaigns/$campaignId/results.tsx`). La sécurité repose sur le filtrage
 * backend de `useAdminCampaign` qui retourne `null` pour une campagne hors périmètre du
 * coach et sur l'endpoint `/admin/participants/:id/matrix` accessible aux coachs via la
 * liste filtrée des participants de leurs campagnes (limite V1.5 documentée dans
 * avancement-2026-04-28.md §5.2).
 */
export const Route = createFileRoute('/coach/campaigns/$campaignId/participants/$participantId/matrix')({
    component: CoachCampaignParticipantMatrixPage,
});

function CoachCampaignParticipantMatrixPage() {
    const { campaignId: campaignIdParam, participantId } = Route.useParams();
    const router = useRouter();
    const campaignId = Number(campaignIdParam);
    const participantIdNum = Number(participantId);

    const { data: campaignDetail, isLoading: campaignLoading } = useAdminCampaign(campaignId);
    const { data: participantDetail } = useParticipant(participantIdNum);
    const qid = campaignDetail?.campaign.questionnaireId ?? '';
    const participantName = participantDetail?.participant.full_name ?? `Participant #${participantId}`;
    const campaignName = campaignDetail?.campaign.name ?? `Campagne #${campaignIdParam}`;

    const {
        data: matrix,
        isLoading: matrixLoading,
        error,
    } = useParticipantQuestionnaireMatrix(participantIdNum, qid);

    const isLoading = campaignLoading || (qid.length > 0 && matrixLoading);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Button
                onClick={() => router.history.back()}
                startIcon={<ArrowLeft size={18} />}
                sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                }}
                disableRipple
            >
                Retour
            </Button>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                mb={4}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ color: 'primary.main', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                        <LayoutPanelLeft size={28} />
                        Matrice des scores
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {participantName} — {campaignName} — Comparaison détaillée entre le Regard sur soi, les retours
                        pairs et l'analyse scientifique.
                    </Typography>
                </Box>
            </Stack>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress size={40} thickness={4} />
                </Box>
            ) : !campaignDetail ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Campagne introuvable ou hors de votre périmètre.
                </Alert>
            ) : qid.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Cette campagne n'a pas de questionnaire associé.
                </Alert>
            ) : error || !matrix ? (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Impossible de charger les données de la matrice pour ce participant.
                </Alert>
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 2.5, overflow: 'visible' }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <QuestionnaireMatrixDisplay matrix={matrix} />
                    </Box>
                </Card>
            )}
        </Box>
    );
}
