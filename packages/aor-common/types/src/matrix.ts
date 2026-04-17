import { z } from 'zod';
import { resultDimSchema } from './questionnaire';

export const matrixPeerColumnSchema = z.object({
    response_id: z.number().int(),
    label: z.string(),
    rater_participant_id: z.number().int().nullable(),
    rated_participant_id: z.number().int().nullable().optional(),
});
export type ParticipantQuestionnaireMatrixPeerColumn = z.infer<typeof matrixPeerColumnSchema>;

export const matrixRowSchema = z.object({
    score_key: z.number().int(),
    label: z.string(),
    self: z.number().nullable(),
    peers: z.array(z.number().nullable()),
    scientific: z.number().nullable(),
});
export type ParticipantQuestionnaireMatrixRow = z.infer<typeof matrixRowSchema>;

export const participantQuestionnaireMatrixSchema = z.object({
    subject_id: z.number().int(),
    questionnaire_id: z.string(),
    questionnaire_title: z.string(),
    likert_max: z.number(),
    scientific_value_max: z.number(),
    peer_columns: z.array(matrixPeerColumnSchema),
    self_response_id: z.number().int().nullable(),
    scientific_response_id: z.number().int().nullable(),
    rows: z.array(matrixRowSchema),
    result_dims: z.array(resultDimSchema),
    short_labels: z.record(z.string(), z.string()),
});
export type ParticipantQuestionnaireMatrix = z.infer<typeof participantQuestionnaireMatrixSchema>;
