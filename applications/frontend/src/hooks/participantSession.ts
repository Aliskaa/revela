import { participantApiClient } from '@/api/participantClient';
import type { CampaignPeerChoice, ParticipantQuestionnaireMatrix, ParticipantSession } from '@/api/types';
import { useQuery } from '@tanstack/react-query';

export const participantSessionKeys = {
    session: ['participant', 'session'] as const,
    matrixRoot: ['participant', 'matrix'] as const,
    matrix: (qid: string, campaignId?: number | null) =>
        [...participantSessionKeys.matrixRoot, campaignId ?? 'none', qid] as const,
    campaignPeersRoot: ['participant', 'campaign-peers'] as const,
    campaignPeers: (campaignId: number) => [...participantSessionKeys.campaignPeersRoot, campaignId] as const,
};

export function useParticipantSession() {
    return useQuery<ParticipantSession>({
        queryKey: participantSessionKeys.session,
        queryFn: () => participantApiClient.get('/participant/session').then(r => r.data),
    });
}

export function useParticipantSessionMatrix(enabled: boolean, qid: string, campaignId?: number | null) {
    const q = qid.trim().toUpperCase();
    return useQuery<ParticipantQuestionnaireMatrix>({
        queryKey: participantSessionKeys.matrix(q, campaignId),
        queryFn: () =>
            participantApiClient
                .get('/participant/matrix', {
                    params: {
                        qid: q,
                        campaign_id: campaignId ?? undefined,
                    },
                })
                .then(r => r.data),
        enabled: enabled && q.length > 0,
    });
}

export function useParticipantCampaignPeers(campaignId: number | null) {
    const enabled = campaignId !== null && campaignId > 0;
    return useQuery<CampaignPeerChoice[]>({
        queryKey: enabled
            ? participantSessionKeys.campaignPeers(campaignId)
            : ([...participantSessionKeys.campaignPeersRoot, 'disabled'] as const),
        queryFn: async () => {
            if (campaignId === null || campaignId <= 0) {
                return [];
            }
            const r = await participantApiClient.get(`/participant/campaigns/${campaignId}/peers`);
            return r.data;
        },
        enabled,
    });
}
