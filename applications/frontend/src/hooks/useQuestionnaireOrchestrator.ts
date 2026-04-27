import { useParticipantSession } from '@/hooks/participantSession';
import { useQuestionnaire } from '@/hooks/questionnaires';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

type UseQuestionnaireOrchestratorProps = {
    qid: string;
    type: 'self' | 'peer' | 'scientific';
    campaignId?: number;
};

export function useQuestionnaireOrchestrator({ qid, type, campaignId }: UseQuestionnaireOrchestratorProps) {
    const navigate = useNavigate();
    const { data: q, isLoading, error } = useQuestionnaire(qid);
    const { data: session } = useParticipantSession();

    const firstName = session?.first_name?.trim() || 'Participant';

    const assignment =
        session?.assignments.find(
            item =>
                item.questionnaire_id.toUpperCase() === qid.toUpperCase() &&
                (campaignId === undefined || (item.campaign_id ?? null) === campaignId)
        ) ?? session?.assignments.find(item => item.questionnaire_id.toUpperCase() === qid.toUpperCase());

    const resolvedCampaignId = assignment?.campaign_id ?? null;
    const progression = assignment?.progression;
    const campaignAllowsQuestionnaire =
        resolvedCampaignId === null ||
        (assignment?.campaign_status === 'active' && assignment?.invitation_confirmed === true);

    useEffect(() => {
        if (!session || !assignment || !progression) {
            return;
        }

        if (type === 'self' && progression.self_rating_status === 'completed') {
            navigate({ to: '/participant', replace: true });
            return;
        }

        if (
            type === 'peer' &&
            (progression.self_rating_status !== 'completed' || progression.peer_feedback_status === 'completed')
        ) {
            navigate({
                to: progression.self_rating_status === 'completed' ? '/participant' : '/participant/self-rating',
                replace: true,
            });
            return;
        }

        if (type === 'scientific') {
            const canSkipManualInputs = assignment.allow_test_without_manual_inputs === true;
            if (!canSkipManualInputs && progression.self_rating_status !== 'completed') {
                navigate({
                    to: '/participant/self-rating',
                    replace: true,
                });
                return;
            }
            if (!canSkipManualInputs && progression.peer_feedback_status !== 'completed') {
                navigate({
                    to: '/participant/peer-feedback',
                    replace: true,
                });
                return;
            }
            if (progression.element_humain_status === 'completed') {
                navigate({ to: '/participant', replace: true });
            }
        }
    }, [assignment, navigate, progression, session, type]);

    return {
        q,
        isLoading,
        error,
        firstName,
        assignment,
        resolvedCampaignId,
        campaignAllowsQuestionnaire,
    };
}
