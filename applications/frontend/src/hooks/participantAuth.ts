import { participantApiClient } from '@/api/participantClient';
import { userParticipant } from '@/lib/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participantSessionKeys } from './participantSession';

export type ParticipantLoginResponse = {
    access_token: string;
};

export function useParticipantLogin() {
    const qc = useQueryClient();
    return useMutation<ParticipantLoginResponse, Error, { email: string; password: string }>({
        mutationFn: credentials => participantApiClient.post('/participant/auth/login', credentials).then(r => r.data),
        onSuccess: data => {
            userParticipant.setToken(data.access_token);
            void qc.invalidateQueries({ queryKey: participantSessionKeys.session });
            void qc.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
        },
    });
}
