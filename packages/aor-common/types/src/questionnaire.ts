import { z } from 'zod';

export const diffPairSchema = z.object({
    e: z.number(),
    w: z.number(),
    if_e_gt: z.string(),
    if_w_gt: z.string(),
});
export type DiffPair = z.infer<typeof diffPairSchema>;

export const resultDimSchema = z.object({
    name: z.string(),
    scores: z.array(z.number()),
    diff_pairs: z.array(diffPairSchema).optional(),
});
export type ResultDim = z.infer<typeof resultDimSchema>;

export const questionSchema = z.object({
    question: z.string(),
    threshold: z.number(),
    function: z.enum(['ge', 'le']),
});
export type Question = z.infer<typeof questionSchema>;

export const questionnaireListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    dimensions: z.array(z.object({ name: z.string(), icon: z.string() })),
});
export type QuestionnaireListItem = z.infer<typeof questionnaireListItemSchema>;

export const questionnaireDetailSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    questions: z.object({
        series_labels: z.array(z.string()),
        series: z.array(z.array(questionSchema)),
    }),
    score_labels: z.record(z.string(), z.string()),
    short_labels: z.record(z.string(), z.string()),
    result_dims: z.array(resultDimSchema),
});
export type QuestionnaireDetail = z.infer<typeof questionnaireDetailSchema>;

/** Body for public (non-authenticated) questionnaire submission — POST /invite/:token/submit. */
export const submitPayloadSchema = z.object({
    info: z.object({ name: z.string(), email: z.string(), organisation: z.string() }),
    series0: z.array(z.number()),
    series1: z.array(z.number()),
});
export type SubmitPayload = z.infer<typeof submitPayloadSchema>;
