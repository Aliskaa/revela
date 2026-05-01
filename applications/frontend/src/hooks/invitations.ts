import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { userParticipant } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import type { InviteInfo, SubmitResult } from '@aor/types';

import { participantSessionKeys } from './participantSession';

type ConfirmParticipationResult = { invitation_confirmed: boolean };

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
            // Le flux invite peut être emprunté par un participant déjà connecté à un autre
            // compte. On force la déconnexion locale pour éviter une session croisée.
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
    return useMutation<{ participant_id: number }, Error, { password: string }>({
        mutationFn: body => apiClient.post(`/invite/${token}/activate`, body).then(r => r.data),
        onSuccess: data => {
            // L'access token est posé en cookie httpOnly côté backend (G1 RGPD). On hydrate
            // le store avec le `participantId` retourné dans le body.
            useAuthStore.getState().setParticipantMe({ participantId: data.participant_id });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.session });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
        },
    });
}
