import type { QuestionnaireDetail } from '@aor/types';
import { participantSessionKeys } from '@/hooks/participantSession';
import type { QueryClient } from '@tanstack/react-query';

export function invalidateParticipantSessionQueries(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.session });
    void queryClient.invalidateQueries({ queryKey: participantSessionKeys.campaignPeersRoot });
}

export function buildDimensionScoreMap(q: QuestionnaireDetail): Record<string, number> {
    const out: Record<string, number> = {};
    for (const dim of q.result_dims) {
        for (const scoreKey of dim.scores) {
            out[String(scoreKey)] = 5;
        }
    }
    return out;
}

export const aorPrimaryButtonSx = {
    py: 1.2,
    px: 3.5,
    borderRadius: 2,
    fontWeight: 700,
    textTransform: 'none' as const,
    boxShadow: '0 4px 14px rgba(21, 21, 176, 0.25)',
};
