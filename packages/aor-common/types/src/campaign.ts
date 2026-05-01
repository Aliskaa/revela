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
