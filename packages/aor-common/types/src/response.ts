import { z } from 'zod';
import { responseSubmissionKindSchema } from './api-common';
import { resultDimSchema } from './questionnaire';

const responseBaseSchema = z.object({
    id: z.number().int(),
    questionnaire_id: z.string(),
    submission_kind: responseSubmissionKindSchema,
    subject_participant_id: z.number().int().nullable(),
    rater_participant_id: z.number().int().nullable(),
    rated_participant_id: z.number().int().nullable(),
    name: z.string(),
    email: z.string(),
    organisation: z.string(),
    submitted_at: z.string(),
    scores: z.record(z.string(), z.number()),
});

export const adminResponseSchema = responseBaseSchema;
export type AdminResponse = z.infer<typeof adminResponseSchema>;

export const responseDetailSchema = responseBaseSchema.extend({
    result_dims: z.array(resultDimSchema),
    score_labels: z.record(z.string(), z.string()),
    short_labels: z.record(z.string(), z.string()),
});
export type ResponseDetail = z.infer<typeof responseDetailSchema>;
