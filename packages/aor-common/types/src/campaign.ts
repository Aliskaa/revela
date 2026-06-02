import { z } from 'zod';
import { campaignStatusSchema, progressStatusSchema } from './api-common';
import { adminResponseSchema } from './response';

export const adminCampaignSchema = z.object({
    id: z.number().int(),
    coachId: z.number().int(),
    companyId: z.number().int(),
    name: z.string(),
    questionnaireId: z.string().nullable(),
    status: campaignStatusSchema,
    allowTestWithoutManualInputs: z.boolean(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    createdAt: z.string().nullable(),
});
export type AdminCampaign = z.infer<typeof adminCampaignSchema>;

export const campaignParticipantProgressSchema = z.object({
    participantId: z.number().int(),
    fullName: z.string(),
    email: z.string(),
    avatar_url: z.string().nullable(),
    selfRatingStatus: progressStatusSchema,
    peerFeedbackStatus: progressStatusSchema,
    elementHumainStatus: progressStatusSchema,
    resultsStatus: progressStatusSchema,
});
export type CampaignParticipantProgress = z.infer<typeof campaignParticipantProgressSchema>;

export const adminCampaignDetailSchema = z.object({
    campaign: adminCampaignSchema,
    participant_progress: z.array(campaignParticipantProgressSchema),
    responses: z.array(adminResponseSchema),
    responses_total: z.number().int(),
});
export type AdminCampaignDetail = z.infer<typeof adminCampaignDetailSchema>;

/**
 * Schémas de validation au bord (ADR-009 §1) pour la branche admin de mutation des
 * campagnes. Ils valident uniquement la **forme transport** (types, optionnalité) ;
 * les règles métier (coach actif, unicité du nom, statut autorisé à la création…)
 * restent dans les use cases.
 */
export const createAdminCampaignBodySchema = z.object({
    coach_id: z.number().optional(),
    company_id: z.number().optional(),
    name: z.string().optional(),
    questionnaire_id: z.string().optional(),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
    allow_test_without_manual_inputs: z.boolean().optional(),
    status: campaignStatusSchema.optional(),
});
export type CreateAdminCampaignBody = z.infer<typeof createAdminCampaignBodySchema>;

export const updateAdminCampaignStatusBodySchema = z.object({
    status: campaignStatusSchema.optional(),
    align_starts_at_to_now: z.boolean().optional(),
});
export type UpdateAdminCampaignStatusBody = z.infer<typeof updateAdminCampaignStatusBodySchema>;

export const reassignCampaignCoachBodySchema = z.object({
    coach_id: z.number().optional(),
});
export type ReassignCampaignCoachBody = z.infer<typeof reassignCampaignCoachBodySchema>;

export const inviteCampaignParticipantsBodySchema = z.object({
    participant_ids: z.array(z.number()).optional(),
});
export type InviteCampaignParticipantsBody = z.infer<typeof inviteCampaignParticipantsBodySchema>;
