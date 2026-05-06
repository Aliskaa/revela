// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { apiClient } from '@/api/client';
import { participantApiClient } from '@/api/participantClient';
import { useToast } from '@/lib/toast';
import type { ParticipantTransparencyScoreEnvelope, ParticipantTransparencyScoreSnapshot } from '@aor/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const toErrorMessage = (err: unknown, fallback: string): string => {
    if (isAxiosError(err)) {
        const data = err.response?.data;
        if (data && typeof data === 'object' && 'message' in data) {
            const apiMessage = (data as { message?: unknown }).message;
            if (typeof apiMessage === 'string' && apiMessage.length > 0) {
                return apiMessage;
            }
        }
    }
    if (err instanceof Error && err.message.length > 0) {
        return err.message;
    }
    return fallback;
};

export const transparencyKeys = {
    participantOwn: (campaignId: number) => ['participant', 'transparency', campaignId] as const,
    adminCampaignParticipant: (campaignId: number, participantId: number) =>
        ['admin', 'campaigns', campaignId, 'participants', participantId, 'transparency'] as const,
};

/** Score de transparence (P23) du participant authentifié pour une campagne. */
export function useParticipantOwnTransparency(campaignId: number | null) {
    const enabled = typeof campaignId === 'number' && campaignId > 0;
    return useQuery<ParticipantTransparencyScoreEnvelope>({
        queryKey: enabled
            ? transparencyKeys.participantOwn(campaignId)
            : (['participant', 'transparency', 'disabled'] as const),
        queryFn: () =>
            participantApiClient.get(`/participant/campaigns/${String(campaignId)}/transparency`).then(r => r.data),
        enabled,
    });
}

/** Vue admin/coach : snapshot transparence d'un participant donné sur une campagne donnée. */
export function useAdminCampaignParticipantTransparency(campaignId: number, participantId: number) {
    const enabled = campaignId > 0 && participantId > 0;
    return useQuery<ParticipantTransparencyScoreEnvelope>({
        queryKey: transparencyKeys.adminCampaignParticipant(campaignId, participantId),
        queryFn: () =>
            apiClient
                .get(`/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/transparency`)
                .then(r => r.data),
        enabled,
    });
}

/**
 * Active manuellement le score de transparence pour un participant donné — réservé coach/admin.
 * Invalide le snapshot admin et le snapshot participant (au cas où le coach et le participant
 * sont sur le même device, p. ex. en démo) après succès.
 */
export function useActivateCampaignParticipantTransparency() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        { snapshot: ParticipantTransparencyScoreSnapshot },
        Error,
        { campaignId: number; participantId: number }
    >({
        mutationFn: ({ campaignId, participantId }) =>
            apiClient
                .post(
                    `/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/transparency/activate`
                )
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({
                queryKey: transparencyKeys.adminCampaignParticipant(vars.campaignId, vars.participantId),
            });
            qc.invalidateQueries({ queryKey: transparencyKeys.participantOwn(vars.campaignId) });
            toast.success('Score de transparence calculé et partagé avec le participant.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec du calcul du score de transparence.')),
    });
}
