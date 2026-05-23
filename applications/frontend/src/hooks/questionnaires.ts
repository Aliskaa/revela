import { apiClient } from '@/api/client';
import { participantApiClient } from '@/api/participantClient';
import { participantSessionKeys } from '@/hooks/participantSession';
import type {
    ElementBDraft,
    ElementBDraftEnvelope,
    QuestionnaireDetail,
    QuestionnaireListItem,
    SubmitParticipantQuestionnaireBody,
    SubmitResult,
    UpsertElementBDraftBody,
} from '@aor/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const questionnaireKeys = {
    all: ['questionnaires'] as const,
    /** Admin UI: uses admin JWT (`apiClient`). */
    allAdmin: ['questionnaires', 'admin'] as const,
    detail: (qid: string) => ['questionnaires', qid] as const,
    elementBDraft: (qid: string, campaignId: number) =>
        ['questionnaires', qid, 'element-b-draft', campaignId] as const,
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
    const queryClient = useQueryClient();
    return useMutation<SubmitResult, Error, SubmitParticipantQuestionnaireBody>({
        mutationFn: payload => {
            if (typeof campaignId !== 'number' || campaignId <= 0) {
                return Promise.reject(new Error('campaignId requis pour soumettre les réponses'));
            }
            return participantApiClient
                .post(`/participant/campaigns/${campaignId}/questionnaires/${qid}/submit`, payload)
                .then(r => r.data);
        },
        onSuccess: () => {
            // La soumission finale supprime le brouillon côté serveur — purge le cache
            // pour ne pas réafficher un draft fantôme si le participant revient sur la page.
            if (typeof campaignId === 'number' && campaignId > 0) {
                void queryClient.invalidateQueries({ queryKey: questionnaireKeys.elementBDraft(qid, campaignId) });
            }
            void queryClient.invalidateQueries({ queryKey: participantSessionKeys.session });
            void queryClient.invalidateQueries({ queryKey: participantSessionKeys.matrixRoot });
        },
    });
}

/**
 * Charge le brouillon Élément Humain du participant pour cette campagne.
 * Retourne `null` quand aucun brouillon n'a encore été enregistré.
 */
export function useElementBDraft(qid: string, campaignId?: number | null) {
    const enabled = !!qid && typeof campaignId === 'number' && campaignId > 0;
    return useQuery<ElementBDraft | null>({
        queryKey: enabled ? questionnaireKeys.elementBDraft(qid, campaignId as number) : ['questionnaires', 'draft', 'disabled'],
        queryFn: () =>
            participantApiClient
                .get<ElementBDraftEnvelope>(`/participant/campaigns/${campaignId}/questionnaires/${qid}/draft`)
                .then(r => r.data.draft),
        enabled,
        // Le brouillon ne change que via les écritures locales — pas la peine de le re-fetcher
        // automatiquement à chaque focus de fenêtre.
        refetchOnWindowFocus: false,
        staleTime: Number.POSITIVE_INFINITY,
    });
}

/** PUT du brouillon (autosave). À appeler à la fin de chaque série. */
export function useUpsertElementBDraft(qid: string, campaignId?: number | null) {
    const queryClient = useQueryClient();
    return useMutation<ElementBDraft, Error, UpsertElementBDraftBody>({
        mutationFn: payload => {
            if (typeof campaignId !== 'number' || campaignId <= 0) {
                return Promise.reject(new Error('campaignId requis pour sauvegarder le brouillon'));
            }
            return participantApiClient
                .put<ElementBDraftEnvelope>(`/participant/campaigns/${campaignId}/questionnaires/${qid}/draft`, payload)
                .then(r => r.data.draft);
        },
        onSuccess: draft => {
            if (typeof campaignId === 'number' && campaignId > 0) {
                queryClient.setQueryData(questionnaireKeys.elementBDraft(qid, campaignId), draft);
            }
        },
    });
}
