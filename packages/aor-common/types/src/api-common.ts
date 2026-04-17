import { z } from 'zod';

export const campaignStatusSchema = z.enum(['draft', 'active', 'closed', 'archived']);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const progressStatusSchema = z.enum(['locked', 'pending', 'completed']);
export type ProgressStatus = z.infer<typeof progressStatusSchema>;

export const responseSubmissionKindSchema = z.enum(['element_humain', 'self_rating', 'peer_rating']);
export type ResponseSubmissionKind = z.infer<typeof responseSubmissionKindSchema>;

export const submitResultSchema = z.object({
    response_id: z.number().int(),
    scores: z.record(z.string(), z.number()),
    qid: z.string(),
});
export type SubmitResult = z.infer<typeof submitResultSchema>;
