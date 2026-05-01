import { useMutation, useQueryClient } from '@tanstack/react-query';

import { participantApiClient } from '@/api/participantClient';
import { useAuthStore } from '@/stores/authStore';

import { participantSessionKeys } from './participantSession';

export type ParticipantLoginResponse = {
    /** Identifiant du participant. L'access token est posé en cookie httpOnly (G1 RGPD). */
    participant_id: number;
};

export function useParticipantLogin() {
    const qc = useQueryClient();
    return useMutation<ParticipantLoginResponse, Error, { email: string; password: string }>({
        mutationFn: credentials => participantApiClient.post('/participant/auth/login', credentials).then(r => r.data),
        onSuccess: data => {
            useAuthStore.getState().setParticipantMe({ participantId: data.participant_id });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.session });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
        },
    });
}
