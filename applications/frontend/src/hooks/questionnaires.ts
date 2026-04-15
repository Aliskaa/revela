import { apiClient } from '@/api/client';
import { participantApiClient } from '@/api/participantClient';
import type {
    QuestionnaireDetail,
    QuestionnaireListItem,
    SubmitParticipantQuestionnaireBody,
    SubmitResult,
} from '@/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';

export const questionnaireKeys = {
    all: ['questionnaires'] as const,
    /** Admin UI: uses admin JWT (`apiClient`). */
    allAdmin: ['questionnaires', 'admin'] as const,
    detail: (qid: string) => ['questionnaires', qid] as const,
};

/** Participant home: requires participant JWT. */
export function useQuestionnaires() {
    return useQuery<QuestionnaireListItem[]>({
        queryKey: questionnaireKeys.all,
        queryFn: () => participantApiClient.get('/questionnaires').then(r => r.data),
    });
}

/** Admin pages (invites, filters): requires admin JWT. */
export function useAdminQuestionnaires() {
    return useQuery<QuestionnaireListItem[]>({
        queryKey: questionnaireKeys.allAdmin,
        queryFn: () => apiClient.get('/questionnaires').then(r => r.data),
    });
}

export function useQuestionnaire(qid: string, options?: { enabled?: boolean }) {
    const enabledByDefault = !!qid;
    const enabled = options?.enabled !== undefined ? options.enabled && !!qid : enabledByDefault;
    return useQuery<QuestionnaireDetail>({
        queryKey: questionnaireKeys.detail(qid),
        queryFn: () => apiClient.get(`/questionnaires/${qid}`).then(r => r.data),
        enabled,
    });
}

export function useSubmitParticipantQuestionnaire(qid: string, campaignId?: number | null) {
    return useMutation<SubmitResult, Error, SubmitParticipantQuestionnaireBody>({
        mutationFn: payload =>
            participantApiClient
                .post(`/participant/questionnaires/${qid}/submit`, payload, {
                    params: { campaign_id: campaignId ?? undefined },
                })
                .then(r => r.data),
    });
}
