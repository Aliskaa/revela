import { apiClient } from '@/api/client';
import { useToast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import type {
    AdminCampaign,
    AdminCampaignDetail,
    AdminCoachDetail,
    AdminDashboard,
    AdminLoginResponse,
    AdminResponse,
    CampaignStatus,
    Coach,
    Company,
    CreateInviteResult,
    InviteToken,
    PaginatedResult,
    Participant,
    ParticipantDetail,
    ParticipantQuestionnaireMatrix,
    UpdateParticipantProfileBody,
} from '@aor/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const toErrorMessage = (err: unknown, fallback: string): string =>
    err instanceof Error && err.message.length > 0 ? err.message : fallback;

export const adminKeys = {
    dashboard: ['admin', 'dashboard'] as const,
    responses: (qid?: string, page?: number, campaignId?: number) =>
        ['admin', 'responses', qid, page, campaignId] as const,
    participants: (page?: number, companyId?: number, perPage?: number) =>
        ['admin', 'participants', page, companyId, perPage] as const,
    participant: (participantId: number) => ['admin', 'participants', participantId] as const,
    participantTokens: (participantId: number) => ['admin', 'participants', participantId, 'tokens'] as const,
    participantMatrix: (participantId: number, qid: string) =>
        ['admin', 'participants', participantId, 'matrix', qid] as const,
    companies: ['admin', 'companies'] as const,
    company: (id: number) => ['admin', 'companies', id] as const,
    coaches: ['admin', 'coaches'] as const,
    coach: (id: number) => ['admin', 'coaches', id] as const,
    campaigns: ['admin', 'campaigns'] as const,
    campaign: (campaignId: number) => ['admin', 'campaigns', campaignId] as const,
};

export function useAdminLogin() {
    return useMutation<AdminLoginResponse, Error, { username: string; password: string }>({
        mutationFn: credentials => apiClient.post('/admin/auth/login', credentials).then(r => r.data),
        onSuccess: data => {
            // L'access token est posé en cookie httpOnly côté backend (G1 RGPD). On hydrate
            // simplement le store avec les claims renvoyés dans le body — `username` n'est
            // pas connu ici, on le récupérera au prochain `GET /admin/auth/me` au besoin.
            useAuthStore.getState().setAdminMe({
                scope: data.scope,
                coachId: data.coach_id,
                username: '',
            });
        },
    });
}

export function useAdminDashboard() {
    return useQuery<AdminDashboard>({
        queryKey: adminKeys.dashboard,
        queryFn: () => apiClient.get('/admin/dashboard').then(r => r.data),
    });
}

export function useAdminResponses(qid?: string, page = 1, perPage = 50, campaignId?: number) {
    return useQuery<PaginatedResult<AdminResponse>>({
        queryKey: adminKeys.responses(qid, page, campaignId),
        queryFn: () =>
            apiClient
                .get('/admin/responses', {
                    params: { qid, campaign_id: campaignId, page, per_page: perPage },
                })
                .then(r => r.data),
    });
}

export function useParticipants(page = 1, companyId?: number, perPage = 25) {
    return useQuery<PaginatedResult<Participant>>({
        queryKey: adminKeys.participants(page, companyId, perPage),
        queryFn: () =>
            apiClient
                .get('/admin/participants', { params: { page, company_id: companyId, per_page: perPage } })
                .then(r => r.data),
    });
}

export function useParticipant(participantId: number) {
    return useQuery<ParticipantDetail>({
        queryKey: adminKeys.participant(participantId),
        queryFn: () => apiClient.get(`/admin/participants/${participantId}`).then(r => r.data),
        enabled: participantId > 0,
    });
}

export function useUpdateParticipant() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<ParticipantDetail, Error, { participantId: number; body: UpdateParticipantProfileBody }>({
        mutationFn: ({ participantId, body }) =>
            apiClient.patch(`/admin/participants/${participantId}`, body).then(r => r.data),
        onSuccess: (data, vars) => {
            qc.setQueryData(adminKeys.participant(vars.participantId), data);
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
            toast.success('Participant mis à jour.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la mise à jour du participant.')),
    });
}

export function useImportParticipants() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<{ created: number; updated: number; errors: string[] }, Error, FormData>({
        mutationFn: formData =>
            apiClient
                .post('/admin/participants/import', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => r.data),
        onSuccess: data => {
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
            const summary = `${data.created} créé(s), ${data.updated} mis à jour.`;
            if (data.errors.length > 0) {
                toast.warning(`Import partiel : ${summary} ${data.errors.length} erreur(s).`);
            } else {
                toast.success(`Import terminé : ${summary}`);
            }
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'import des participants.")),
    });
}

export function useCreateInvite() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        CreateInviteResult,
        Error,
        { participantId: number; campaignId: number; questionnaireId: string; sendEmail?: boolean }
    >({
        mutationFn: ({ participantId, campaignId, questionnaireId, sendEmail }) =>
            apiClient
                .post(`/admin/participants/${participantId}/invite`, {
                    campaign_id: campaignId,
                    questionnaire_id: questionnaireId,
                    send_email: Boolean(sendEmail),
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
            qc.invalidateQueries({ queryKey: adminKeys.participantTokens(vars.participantId) });
            toast.success(vars.sendEmail ? 'Invitation envoyée par e-mail.' : 'Lien d’invitation créé.');
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de la création de l'invitation.")),
    });
}

export function useParticipantTokens(participantId: number | null) {
    return useQuery<InviteToken[]>({
        queryKey: participantId
            ? adminKeys.participantTokens(participantId)
            : ['admin', 'participants', 'tokens', 'none'],
        queryFn: () => apiClient.get(`/admin/participants/${participantId}/tokens`).then(r => r.data),
        enabled: typeof participantId === 'number' && participantId > 0,
    });
}

export function useParticipantQuestionnaireMatrix(participantId: number, qid: string) {
    const q = qid.trim().toUpperCase();
    return useQuery<ParticipantQuestionnaireMatrix>({
        queryKey: adminKeys.participantMatrix(participantId, q),
        queryFn: () =>
            apiClient.get(`/admin/participants/${participantId}/matrix`, { params: { qid: q } }).then(r => r.data),
        enabled: participantId > 0 && q.length > 0,
    });
}

export function useDeleteParticipant() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        {
            message: string;
            deleted_participant_id: number;
            responses_removed: number;
            invite_tokens_removed: number;
        },
        Error,
        { participantId: number }
    >({
        mutationFn: ({ participantId }) =>
            apiClient
                .delete(`/admin/participants/${participantId}`, {
                    data: { confirm: true },
                })
                .then(r => r.data),
        onSuccess: data => {
            qc.invalidateQueries({ queryKey: ['admin'] });
            toast.success(
                `Participant supprimé. ${data.responses_removed} réponse(s) et ${data.invite_tokens_removed} jeton(s) effacé(s).`
            );
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la suppression du participant.')),
    });
}

export function useCompanies() {
    return useQuery<Company[]>({
        queryKey: adminKeys.companies,
        queryFn: () => apiClient.get('/admin/companies').then(r => r.data),
    });
}

export function useCreateCompany() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<Company, Error, { name: string; contactName?: string | null; contactEmail?: string | null }>({
        mutationFn: payload =>
            apiClient
                .post('/admin/companies', {
                    name: payload.name,
                    contact_name: payload.contactName ?? null,
                    contact_email: payload.contactEmail ?? null,
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success(`Entreprise « ${vars.name} » créée.`);
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de la création de l'entreprise.")),
    });
}

export function useUpdateCompany() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        Company,
        Error,
        {
            companyId: number;
            name?: string;
            contactName?: string | null;
            contactEmail?: string | null;
        }
    >({
        mutationFn: payload =>
            apiClient
                .patch(`/admin/companies/${payload.companyId}`, {
                    name: payload.name,
                    contact_name: payload.contactName,
                    contact_email: payload.contactEmail,
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.invalidateQueries({ queryKey: adminKeys.company(vars.companyId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success('Entreprise mise à jour.');
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de la mise à jour de l'entreprise.")),
    });
}

export function useDeleteCompany() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<void, Error, { companyId: number }>({
        mutationFn: ({ companyId }) => apiClient.delete(`/admin/companies/${companyId}`).then(() => undefined),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.removeQueries({ queryKey: adminKeys.company(vars.companyId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success('Entreprise supprimée.');
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de la suppression de l'entreprise.")),
    });
}

export function useMailStatus() {
    return useQuery<{ configured: boolean }>({
        queryKey: ['admin', 'mail', 'status'] as const,
        queryFn: () => apiClient.get('/admin/mail/status').then(r => r.data),
    });
}

export function useCoaches() {
    return useQuery<Coach[]>({
        queryKey: adminKeys.coaches,
        queryFn: () => apiClient.get('/admin/coaches').then(r => r.data),
    });
}

export function useCreateCoach() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<Coach, Error, { username: string; password: string; displayName: string }>({
        mutationFn: payload =>
            apiClient
                .post('/admin/coaches', {
                    username: payload.username,
                    password: payload.password,
                    display_name: payload.displayName,
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
            toast.success(`Coach « ${vars.displayName} » créé.`);
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la création du coach.')),
    });
}

export function useAdminCoach(coachId: number, options?: { enabled?: boolean }) {
    return useQuery<AdminCoachDetail>({
        queryKey: adminKeys.coach(coachId),
        queryFn: () => apiClient.get(`/admin/coaches/${coachId}`).then(r => r.data),
        enabled: (options?.enabled ?? true) && coachId > 0,
    });
}

export function useUpdateCoach() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        Coach,
        Error,
        {
            coachId: number;
            username?: string;
            displayName?: string;
            password?: string;
            isActive?: boolean;
        }
    >({
        mutationFn: payload =>
            apiClient
                .patch(`/admin/coaches/${payload.coachId}`, {
                    ...(payload.username !== undefined ? { username: payload.username } : {}),
                    ...(payload.displayName !== undefined ? { display_name: payload.displayName } : {}),
                    ...(payload.password !== undefined && payload.password.length > 0
                        ? { password: payload.password }
                        : {}),
                    ...(payload.isActive !== undefined ? { is_active: payload.isActive } : {}),
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
            qc.invalidateQueries({ queryKey: adminKeys.coach(vars.coachId) });
            toast.success('Coach mis à jour.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la mise à jour du coach.')),
    });
}

export function useDeleteCoach() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<void, Error, { coachId: number }>({
        mutationFn: ({ coachId }) => apiClient.delete(`/admin/coaches/${coachId}`).then(() => undefined),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
            qc.removeQueries({ queryKey: adminKeys.coach(vars.coachId) });
            toast.success('Coach supprimé.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la suppression du coach.')),
    });
}

export function useAdminCampaigns() {
    return useQuery<AdminCampaign[]>({
        queryKey: adminKeys.campaigns,
        queryFn: () => apiClient.get('/admin/campaigns').then(r => r.data),
        refetchOnMount: 'always',
    });
}

export function useAdminCampaign(campaignId: number) {
    return useQuery<AdminCampaignDetail | null>({
        queryKey: adminKeys.campaign(campaignId),
        queryFn: () => apiClient.get(`/admin/campaigns/${campaignId}`).then(r => r.data),
        enabled: campaignId > 0,
        refetchOnMount: 'always',
    });
}

export function useCreateAdminCampaign() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        AdminCampaign,
        Error,
        {
            companyId: number;
            coachId: number;
            name: string;
            questionnaireId: string;
            startsAt?: string | null;
            endsAt?: string | null;
            allowTestWithoutManualInputs?: boolean;
            status?: CampaignStatus;
        }
    >({
        mutationFn: payload =>
            apiClient
                .post('/admin/campaigns', {
                    company_id: payload.companyId,
                    coach_id: payload.coachId,
                    name: payload.name,
                    questionnaire_id: payload.questionnaireId,
                    starts_at: payload.startsAt ?? null,
                    ends_at: payload.endsAt ?? null,
                    allow_test_without_manual_inputs: Boolean(payload.allowTestWithoutManualInputs),
                    status: payload.status ?? 'draft',
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success(`Campagne « ${vars.name} » créée.`);
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la création de la campagne.')),
    });
}

export function useUpdateAdminCampaignStatus() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        AdminCampaign,
        Error,
        { campaignId: number; status: CampaignStatus; align_starts_at_to_now?: boolean }
    >({
        mutationFn: ({ campaignId, status, align_starts_at_to_now }) =>
            apiClient
                .post(`/admin/campaigns/${campaignId}/status`, {
                    status,
                    ...(align_starts_at_to_now ? { align_starts_at_to_now: true } : {}),
                })
                .then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success(`Statut de la campagne mis à jour : ${vars.status}.`);
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec du changement de statut.')),
    });
}

export function useReassignCampaignCoach() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<AdminCampaign, Error, { campaignId: number; coachId: number }>({
        mutationFn: ({ campaignId, coachId }) =>
            apiClient.patch(`/admin/campaigns/${campaignId}/coach`, { coach_id: coachId }).then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
            toast.success('Coach réassigné.');
        },
        onError: err => toast.error(toErrorMessage(err, 'Échec de la réassignation du coach.')),
    });
}

export function useArchiveAdminCampaign() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<AdminCampaign, Error, { campaignId: number }>({
        mutationFn: ({ campaignId }) => apiClient.post(`/admin/campaigns/${campaignId}/archive`).then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            toast.success('Campagne archivée.');
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'archivage de la campagne.")),
    });
}

export function useInviteCampaignParticipants() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<{ created: number }, Error, { campaignId: number; participantIds?: number[] }>({
        mutationFn: ({ campaignId, participantIds }) =>
            apiClient
                .post(`/admin/campaigns/${campaignId}/invite-company-participants`, {
                    ...(participantIds !== undefined ? { participant_ids: participantIds } : {}),
                })
                .then(r => r.data),
        onSuccess: (data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
            toast.success(`${data.created} invitation(s) envoyée(s).`);
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'envoi des invitations.")),
    });
}

export function useImportParticipantsToCompany() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        { created: number; updated: number; errors: string[] },
        Error,
        { companyId: number; formData: FormData }
    >({
        mutationFn: ({ companyId, formData }) =>
            apiClient
                .post(`/admin/companies/${companyId}/participants/import`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => r.data),
        onSuccess: (data, vars) => {
            // Invalidation par préfixe : `adminKeys.participants()` produit
            // `[..., undefined, undefined, undefined]` qui ne matche pas les clés paginées
            // (React Query 5 n'applique pas de wildcard sur `undefined`). On passe donc le
            // préfixe brut pour rafraîchir toutes les variantes (page/companyId/perPage).
            qc.invalidateQueries({ queryKey: ['admin', 'participants'] });
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.invalidateQueries({ queryKey: adminKeys.company(vars.companyId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            const summary = `${data.created} créé(s), ${data.updated} mis à jour.`;
            if (data.errors.length > 0) {
                toast.warning(`Import partiel : ${summary} ${data.errors.length} erreur(s).`);
            } else {
                toast.success(`Import terminé : ${summary}`);
            }
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'import.")),
    });
}

export function useImportParticipantsToCampaign() {
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation<
        { created: number; updated: number; invited: number; errors: string[] },
        Error,
        { campaignId: number; formData: FormData }
    >({
        mutationFn: ({ campaignId, formData }) =>
            apiClient
                .post(`/admin/campaigns/${campaignId}/import-participants`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => r.data),
        onSuccess: (data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
            const summary = `${data.created} créé(s), ${data.updated} mis à jour, ${data.invited} invité(s).`;
            if (data.errors.length > 0) {
                toast.warning(`Import partiel : ${summary} ${data.errors.length} erreur(s).`);
            } else {
                toast.success(`Import terminé : ${summary}`);
            }
        },
        onError: err => toast.error(toErrorMessage(err, "Échec de l'import.")),
    });
}
