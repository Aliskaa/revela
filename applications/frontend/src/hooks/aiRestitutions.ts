// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { apiClient } from '@/api/client';
import { participantApiClient } from '@/api/participantClient';
import { useToast } from '@/lib/toast';
import type { AiRestitutionAdminEnvelope, AiRestitutionParticipantView, EditAiRestitutionBody } from '@aor/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const toErrorMessage = (err: unknown, fallback: string): string => {
    if (isAxiosError(err)) {
        const data = err.response?.data;
        if (data && typeof data === 'object' && 'error' in data) {
            const apiMessage = (data as { error?: unknown }).error;
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

export const aiRestitutionKeys = {
    adminCampaignParticipant: (campaignId: number, participantId: number) =>
        ['admin', 'campaigns', campaignId, 'participants', participantId, 'restitution'] as const,
    participantOwn: (campaignId: number) => ['participant', 'campaigns', campaignId, 'restitution'] as const,
};

/** Lecture admin/coach de la restitution IA d'un participant sur une campagne. */
export function useAdminAiRestitution(campaignId: number, participantId: number) {
    const enabled = campaignId > 0 && participantId > 0;
    return useQuery<AiRestitutionAdminEnvelope>({
        queryKey: aiRestitutionKeys.adminCampaignParticipant(campaignId, participantId),
        queryFn: () =>
            apiClient
                .get(`/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/restitution`)
                .then(r => r.data),
        enabled,
    });
}

/**
 * Body envoyé à `POST .../restitution/generate` — miroir du `HarnessInput`
 * §5 PDF Marius. La validation Zod côté backend (`harnessInputSchema`)
 * fait foi ; côté frontend on relâche le typage pour ne pas dupliquer
 * tout le schéma (le contrat reste `module='firo_b_short_restitution'`,
 * `language='fr'`, scores 0-9, transparency 0-100).
 */
export type GenerateAiRestitutionBody = {
    module: 'firo_b_short_restitution';
    language: 'fr';
    scores: {
        inclusion: { expressed: number; wanted: number; peer_feedback: number };
        control: { expressed: number; wanted: number; peer_feedback: number };
        openness: { expressed: number; wanted: number; peer_feedback: number };
        transparency: { score: number };
    };
};

export function useGenerateAiRestitution() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        AiRestitutionAdminEnvelope,
        Error,
        { campaignId: number; participantId: number; body: GenerateAiRestitutionBody }
    >({
        mutationFn: ({ campaignId, participantId, body }) =>
            apiClient
                .post(
                    `/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/restitution/generate`,
                    body
                )
                .then(r => r.data),
        onSuccess: (data, vars) => {
            qc.invalidateQueries({
                queryKey: aiRestitutionKeys.adminCampaignParticipant(vars.campaignId, vars.participantId),
            });
            qc.invalidateQueries({ queryKey: aiRestitutionKeys.participantOwn(vars.campaignId) });
            const status = data.restitution?.status;
            if (status === 'generated') {
                toast.success('Restitution générée et conforme au validateur §9.');
            } else if (status === 'rejected') {
                toast.warning(
                    'La restitution a été générée mais rejetée par le validateur §9 après 3 tentatives. Régénère ou édite manuellement.'
                );
            } else {
                toast.info('Restitution traitée.');
            }
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la génération de la restitution.')),
    });
}

export function useEditAiRestitution() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        AiRestitutionAdminEnvelope,
        Error,
        { campaignId: number; participantId: number; body: EditAiRestitutionBody }
    >({
        mutationFn: ({ campaignId, participantId, body }) =>
            apiClient
                .put(`/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/restitution`, body)
                .then(r => r.data),
        onSuccess: (data, vars) => {
            qc.invalidateQueries({
                queryKey: aiRestitutionKeys.adminCampaignParticipant(vars.campaignId, vars.participantId),
            });
            const ok = data.restitution?.validation_report?.ok ?? false;
            if (ok) {
                toast.success('Édition enregistrée — la restitution passe le validateur §9.');
            } else {
                toast.warning(
                    "Édition enregistrée — le validateur §9 signale encore des écarts. Approve sera bloqué tant que ce n'est pas conforme."
                );
            }
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'édition de la restitution.")),
    });
}

export function useApproveAiRestitution() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<AiRestitutionAdminEnvelope, Error, { campaignId: number; participantId: number }>({
        mutationFn: ({ campaignId, participantId }) =>
            apiClient
                .post(
                    `/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/restitution/approve`
                )
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({
                queryKey: aiRestitutionKeys.adminCampaignParticipant(vars.campaignId, vars.participantId),
            });
            qc.invalidateQueries({ queryKey: aiRestitutionKeys.participantOwn(vars.campaignId) });
            toast.success('Restitution approuvée et diffusée au participant.');
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'approbation.")),
    });
}

export function useRejectAiRestitution() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<AiRestitutionAdminEnvelope, Error, { campaignId: number; participantId: number }>({
        mutationFn: ({ campaignId, participantId }) =>
            apiClient
                .post(`/admin/campaigns/${String(campaignId)}/participants/${String(participantId)}/restitution/reject`)
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({
                queryKey: aiRestitutionKeys.adminCampaignParticipant(vars.campaignId, vars.participantId),
            });
            qc.invalidateQueries({ queryKey: aiRestitutionKeys.participantOwn(vars.campaignId) });
            toast.info('Restitution rejetée — non diffusée au participant.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec du rejet.')),
    });
}

/**
 * Lecture côté participant authentifié — 404 backend tant que `status !== 'approved'`.
 * On gobe le 404 pour renvoyer `null` (cas attendu, pas une erreur).
 */
export function useParticipantOwnAiRestitution(campaignId: number | null) {
    const enabled = typeof campaignId === 'number' && campaignId > 0;
    return useQuery<AiRestitutionParticipantView | null>({
        queryKey: enabled
            ? aiRestitutionKeys.participantOwn(campaignId)
            : (['participant', 'campaigns', 'disabled', 'restitution'] as const),
        queryFn: () =>
            participantApiClient
                .get(`/participant/campaigns/${String(campaignId)}/restitution`)
                .then(r => r.data as AiRestitutionParticipantView)
                .catch(err => {
                    if (isAxiosError(err) && err.response?.status === 404) {
                        return null;
                    }
                    throw err;
                }),
        enabled,
    });
}
