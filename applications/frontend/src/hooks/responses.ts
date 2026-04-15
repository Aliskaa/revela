import { participantApiClient } from '@/api/participantClient';
import type { ResponseDetail } from '@/api/types';
import { useQuery } from '@tanstack/react-query';

export const responseKeys = {
    detail: (id: number) => ['responses', id] as const,
};

export function useResponse(responseId: number) {
    return useQuery<ResponseDetail>({
        queryKey: responseKeys.detail(responseId),
        queryFn: () => participantApiClient.get(`/participant/responses/${responseId}`).then(r => r.data),
        enabled: !!responseId,
    });
}
