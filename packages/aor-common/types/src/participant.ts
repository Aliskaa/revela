import { z } from 'zod';
import { campaignStatusSchema, progressStatusSchema } from './api-common';

export const participantSchema = z.object({
    id: z.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    email: z.string(),
    company: z.object({ id: z.number().int(), name: z.string() }).nullable(),
    invite_status: z.record(z.string(), z.string()),
    response_count: z.number().int(),
});
export type Participant = z.infer<typeof participantSchema>;

export const campaignPeerChoiceSchema = z.object({
    participant_id: z.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
});
export type CampaignPeerChoice = z.infer<typeof campaignPeerChoiceSchema>;

const participantSessionProgressionSchema = z.object({
    self_rating_status: progressStatusSchema,
    peer_feedback_status: progressStatusSchema,
    element_humain_status: progressStatusSchema,
    results_status: progressStatusSchema,
});

const participantSessionAssignmentSchema = z.object({
    campaign_id: z.number().int().nullable(),
    campaign_name: z.string().nullable(),
    company_id: z.number().int().nullable(),
    company_name: z.string().nullable(),
    coach_id: z.number().int().nullable(),
    coach_name: z.string().nullable(),
    questionnaire_id: z.string(),
    questionnaire_title: z.string(),
    campaign_status: campaignStatusSchema.nullable(),
    allow_test_without_manual_inputs: z.boolean(),
    invitation_confirmed: z.boolean(),
    progression: participantSessionProgressionSchema.nullable(),
});

export const participantSessionSchema = z.object({
    participant_id: z.number().int(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    assignments: z.array(participantSessionAssignmentSchema),
});
export type ParticipantSession = z.infer<typeof participantSessionSchema>;
