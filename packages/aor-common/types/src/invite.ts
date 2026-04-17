import { z } from 'zod';
import { campaignStatusSchema } from './api-common';

export const inviteInfoSchema = z.object({
    token: z.string(),
    questionnaire_id: z.string(),
    questionnaire_title: z.string(),
    needs_activation: z.boolean(),
    campaign_id: z.number().int().nullable(),
    campaign_status: campaignStatusSchema.nullable(),
    invitation_confirmed: z.boolean(),
    needs_participation_confirmation: z.boolean(),
    participant_id: z.number().int(),
    participant: z.object({
        name: z.string(),
        email: z.string(),
        organisation: z.string(),
    }),
});
export type InviteInfo = z.infer<typeof inviteInfoSchema>;

export const inviteTokenSchema = z.object({
    id: z.number().int(),
    token: z.string(),
    campaign_id: z.number().int().nullable(),
    questionnaire_id: z.string(),
    status: z.string(),
    created_at: z.string().optional(),
    expires_at: z.string().nullable(),
    used_at: z.string().nullable().optional(),
    invite_url: z.string(),
});
export type InviteToken = z.infer<typeof inviteTokenSchema>;

export const createInviteResultSchema = inviteTokenSchema.extend({
    mail_sent: z.boolean(),
    mail_error: z.string().nullable(),
    mail_configured: z.boolean(),
});
export type CreateInviteResult = z.infer<typeof createInviteResultSchema>;
