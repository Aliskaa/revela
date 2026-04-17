import { apiClient } from '@/api/client';
import type {
    AdminCampaign,
    AdminCampaignDetail,
    AdminCoachDetail,
    AdminDashboard,
    AdminResponse,
    CampaignStatus,
    Coach,
    Company,
    CreateInviteResult,
    InviteToken,
    PaginatedResult,
    Participant,
    ParticipantQuestionnaireMatrix,
    ResponseDetail,
} from '@aor/types';
import { userAdmin } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminKeys = {
    dashboard: ['admin', 'dashboard'] as const,
    responses: (qid?: string, page?: number, campaignId?: number) =>
        ['admin', 'responses', qid, page, campaignId] as const,
    response: (id: number) => ['admin', 'responses', id] as const,
    participants: (page?: number, companyId?: number) => ['admin', 'participants', page, companyId] as const,
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
    return useMutation<{ access_token: string }, Error, { username: string; password: string }>({
        mutationFn: credentials => apiClient.post('/admin/auth/login', credentials).then(r => r.data),
        onSuccess: data => {
            userAdmin.setToken(data.access_token);
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

export function useAdminResponse(id: number) {
    return useQuery<ResponseDetail>({
        queryKey: adminKeys.response(id),
        queryFn: () => apiClient.get(`/admin/responses/${id}`).then(r => r.data),
        enabled: !!id,
    });
}

export function useParticipants(page = 1, companyId?: number) {
    return useQuery<PaginatedResult<Participant>>({
        queryKey: adminKeys.participants(page, companyId),
        queryFn: () =>
            apiClient.get('/admin/participants', { params: { page, company_id: companyId } }).then(r => r.data),
    });
}

export function useImportParticipants() {
    const qc = useQueryClient();
    return useMutation<{ created: number; updated: number; errors: string[] }, Error, FormData>({
        mutationFn: formData =>
            apiClient
                .post('/admin/participants/import', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                })
                .then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
        },
    });
}

export function useCreateInvite() {
    const qc = useQueryClient();
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
        },
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin'] });
        },
    });
}

export function useDeleteResponse() {
    const qc = useQueryClient();
    return useMutation<{ message: string; deleted_response_id: number }, Error, { responseId: number }>({
        mutationFn: ({ responseId }) =>
            apiClient
                .delete(`/admin/responses/${responseId}`, {
                    data: { confirm: true },
                })
                .then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin'] });
        },
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
    return useMutation<Company, Error, { name: string; contactName?: string | null; contactEmail?: string | null }>({
        mutationFn: payload =>
            apiClient
                .post('/admin/companies', {
                    name: payload.name,
                    contact_name: payload.contactName ?? null,
                    contact_email: payload.contactEmail ?? null,
                })
                .then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
        },
    });
}

export function useUpdateCompany() {
    const qc = useQueryClient();
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
        },
    });
}

export function useDeleteCompany() {
    const qc = useQueryClient();
    return useMutation<void, Error, { companyId: number }>({
        mutationFn: ({ companyId }) => apiClient.delete(`/admin/companies/${companyId}`).then(() => undefined),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.companies });
            qc.removeQueries({ queryKey: adminKeys.company(vars.companyId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
        },
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
    return useMutation<Coach, Error, { username: string; password: string; displayName: string }>({
        mutationFn: payload =>
            apiClient
                .post('/admin/coaches', {
                    username: payload.username,
                    password: payload.password,
                    display_name: payload.displayName,
                })
                .then(r => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
        },
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
        },
    });
}

export function useDeleteCoach() {
    const qc = useQueryClient();
    return useMutation<void, Error, { coachId: number }>({
        mutationFn: ({ coachId }) => apiClient.delete(`/admin/coaches/${coachId}`).then(() => undefined),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
            qc.removeQueries({ queryKey: adminKeys.coach(vars.coachId) });
        },
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
        },
    });
}

export function useUpdateAdminCampaignStatus() {
    const qc = useQueryClient();
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
        },
    });
}

export function useReassignCampaignCoach() {
    const qc = useQueryClient();
    return useMutation<AdminCampaign, Error, { campaignId: number; coachId: number }>({
        mutationFn: ({ campaignId, coachId }) =>
            apiClient.patch(`/admin/campaigns/${campaignId}/coach`, { coach_id: coachId }).then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
            qc.invalidateQueries({ queryKey: adminKeys.coaches });
        },
    });
}

export function useArchiveAdminCampaign() {
    const qc = useQueryClient();
    return useMutation<AdminCampaign, Error, { campaignId: number }>({
        mutationFn: ({ campaignId }) => apiClient.post(`/admin/campaigns/${campaignId}/archive`).then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaigns });
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.dashboard });
        },
    });
}

export function useInviteCampaignParticipants() {
    const qc = useQueryClient();
    return useMutation<{ created: number }, Error, { campaignId: number }>({
        mutationFn: ({ campaignId }) =>
            apiClient.post(`/admin/campaigns/${campaignId}/invite-company-participants`).then(r => r.data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
        },
    });
}

export function useImportParticipantsToCampaign() {
    const qc = useQueryClient();
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
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: adminKeys.campaign(vars.campaignId) });
            qc.invalidateQueries({ queryKey: adminKeys.participants() });
        },
    });
}
