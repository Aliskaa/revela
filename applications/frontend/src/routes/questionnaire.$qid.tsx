import { SegmentedProgress } from '@/components/common/SegmentedProgress';
import { ParticipantLayout } from '@/components/layout/ParticipantLayout';
import { PeerRatingStep } from '@/components/questionnaire/PeerRatingStep';
import { ScientificTestStep } from '@/components/questionnaire/ScientificTestStep';
import { SelfRatingStep } from '@/components/questionnaire/SelfRatingStep';
import { useQuestionnaireOrchestrator } from '@/hooks/useQuestionnaireOrchestrator';
import { userParticipant } from '@/lib/auth';
import { Alert, Box, Paper } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { createFileRoute, redirect } from '@tanstack/react-router';

type QuestionnaireSearch = {
    type: 'self' | 'peer' | 'scientific';
    campaign_id?: number;
};

export const Route = createFileRoute('/questionnaire/$qid')({
    beforeLoad: () => {
        if (!userParticipant.isAuthenticated()) {
            throw redirect({ to: '/login' });
        }
    },
    validateSearch: (search: Record<string, unknown>): QuestionnaireSearch => {
        const type = search.type === 'peer' || search.type === 'scientific' ? search.type : 'self';
        const campaignRaw = search.campaign_id;
        const campaign =
            typeof campaignRaw === 'number'
                ? campaignRaw
                : typeof campaignRaw === 'string' && campaignRaw.trim().length > 0
                  ? Number.parseInt(campaignRaw, 10)
                  : undefined;
        return {
            type,
            campaign_id: Number.isFinite(campaign) ? campaign : undefined,
        };
    },
    component: QuestionnaireRouteComponent,
});

function QuestionnaireRouteComponent() {
    const { qid } = Route.useParams();
    const { type, campaign_id: campaignId } = Route.useSearch();

    const { q, isLoading, error, firstName, assignment, resolvedCampaignId, campaignAllowsQuestionnaire } =
        useQuestionnaireOrchestrator({
            qid,
            type,
            campaignId,
        });

    if (isLoading) {
        return (
            <ParticipantLayout
                activeNav="journey"
                headerTitle={`Bonjour, ${firstName}`}
                headerSubtitle="Chargement du questionnaire…"
            >
                <Box sx={{ py: 10, textAlign: 'center' }}>
                    <CircularProgress sx={{ color: 'primary.main' }} />
                </Box>
            </ParticipantLayout>
        );
    }

    if (error || !q) {
        return (
            <ParticipantLayout
                activeNav="journey"
                headerTitle={`Bonjour, ${firstName}`}
                headerSubtitle="Parcours participant"
            >
                <Alert severity="error">Questionnaire introuvable.</Alert>
            </ParticipantLayout>
        );
    }

    if (!assignment) {
        return (
            <ParticipantLayout activeNav="journey" headerTitle={`Bonjour, ${firstName}`} headerSubtitle={q.title}>
                <Alert severity="error">Aucune assignation active trouvée pour ce questionnaire.</Alert>
            </ParticipantLayout>
        );
    }

    if (!resolvedCampaignId) {
        return (
            <ParticipantLayout activeNav="journey" headerTitle={`Bonjour, ${firstName}`} headerSubtitle={q.title}>
                <Alert severity="warning">
                    Cette assignation n'est liée à aucune campagne. Contactez un administrateur pour activer le parcours
                    V1.
                </Alert>
            </ParticipantLayout>
        );
    }

    if (!campaignAllowsQuestionnaire) {
        const notConfirmed = assignment.invitation_confirmed !== true;
        const notActive = assignment.campaign_status !== 'active';
        return (
            <ParticipantLayout activeNav="journey" headerTitle={`Bonjour, ${firstName}`} headerSubtitle={q.title}>
                <Alert severity="warning">
                    {notConfirmed
                        ? 'Vous devez confirmer votre participation à la campagne (lien d’invitation) avant de répondre aux questionnaires.'
                        : notActive
                          ? 'Cette campagne est encore en brouillon ou fermée : les questionnaires ne sont pas accessibles tant qu’elle n’est pas active.'
                          : 'Les questionnaires ne sont pas accessibles pour cette campagne pour le moment.'}
                </Alert>
            </ParticipantLayout>
        );
    }

    const stepCopy = {
        self: { line: 'Étape 1 : Auto-évaluation — En cours', highlight: 'En cours', seg: 1 as const },
        peer: { line: 'Étape 2 : Feedback des pairs — En cours', highlight: 'En cours', seg: 2 as const },
        scientific: { line: 'Étape 3 : Test ICO Élément humain — En cours', highlight: 'En cours', seg: 3 as const },
    };
    const sc = stepCopy[type];

    return (
        <ParticipantLayout
            activeNav="journey"
            headerTitle={`Bonjour, ${firstName}`}
            headerSubtitle={q.title}
            stepLine={sc.line}
            stepHighlight={sc.highlight}
            topRightNote="Espace d'évaluation"
        >
            <SegmentedProgress activeStep={sc.seg} />
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 3.5 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    maxWidth: 1200,
                    mx: 'auto',
                    mt: 2,
                }}
            >
                <Alert
                    severity="info"
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        '& .MuiAlert-message': { fontWeight: 500 },
                    }}
                >
                    <strong>Rappel :</strong> Il n'y a pas de bonnes ou de mauvaises réponses. Utilisez toute l'échelle
                    pour refléter au mieux vos ressentis.
                </Alert>

                {type === 'self' && <SelfRatingStep qid={qid} q={q} campaignId={resolvedCampaignId} />}
                {type === 'peer' && <PeerRatingStep qid={qid} q={q} campaignId={resolvedCampaignId} />}
                {type === 'scientific' && <ScientificTestStep qid={qid} q={q} campaignId={resolvedCampaignId} />}
            </Paper>
        </ParticipantLayout>
    );
}
