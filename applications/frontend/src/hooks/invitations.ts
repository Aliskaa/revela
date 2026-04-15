import { apiClient } from '@/api/client';
import type { InviteInfo, SubmitResult } from '@/api/types';
import { userParticipant } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type ConfirmParticipationResult = { invitation_confirmed: boolean };
import { participantSessionKeys } from './participantSession';

interface InviteSubmitPayload {
    series0: number[];
    series1: number[];
}

export function useInvite(token: string) {
    return useQuery<InviteInfo>({
        queryKey: ['invite', token],
        queryFn: () => apiClient.get(`/invite/${token}`).then(r => r.data),
        enabled: Boolean(token),
        retry: false,
    });
}

export function useConfirmInviteParticipation(token: string) {
    const qc = useQueryClient();
    return useMutation<ConfirmParticipationResult, Error, void>({
        mutationFn: () => apiClient.post(`/invite/${token}/confirm-participation`).then(r => r.data),
        onSuccess: () => {
            userParticipant.removeToken();
            void qc.invalidateQueries({ queryKey: participantSessionKeys.session });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.campaignPeersRoot });
            void qc.invalidateQueries({ queryKey: ['invite', token] });
        },
    });
}

export function useSubmitInvite(token: string) {
    return useMutation<SubmitResult, Error, InviteSubmitPayload>({
        mutationFn: payload => apiClient.post(`/invite/${token}/submit`, payload).then(r => r.data),
    });
}

export function useActivateInvite(token: string) {
    const qc = useQueryClient();
    return useMutation<{ access_token: string }, Error, { password: string }>({
        mutationFn: body => apiClient.post(`/invite/${token}/activate`, body).then(r => r.data),
        onSuccess: data => {
            userParticipant.setToken(data.access_token);
            void qc.invalidateQueries({ queryKey: participantSessionKeys.session });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
        },
    });
}
