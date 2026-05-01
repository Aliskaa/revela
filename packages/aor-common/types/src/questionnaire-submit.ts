import { z } from 'zod';

const answerValueSchema = z.int().min(0).max(5);
export const answerSeriesSchema = z.array(answerValueSchema).length(54);

export const questionnaireInfoSchema = z.object({
    name: z.string(),
    email: z.string(),
    organisation: z.string().optional(),
});

export const submitQuestionnaireBodySchema = z.object({
    info: questionnaireInfoSchema,
    series0: answerSeriesSchema,
    series1: answerSeriesSchema,
});

export const submitInviteQuestionnaireBodySchema = z.object({
    series0: answerSeriesSchema,
    series1: answerSeriesSchema,
});

const likertScoresRecordSchema = z.record(z.string(), z.int().min(0).max(9));

export const submitParticipantSelfRatingBodySchema = z.object({
    kind: z.literal('self_rating'),
    scores: likertScoresRecordSchema,
});

export const submitParticipantPeerRatingBodySchema = z.object({
    kind: z.literal('peer_rating'),
    peer_label: z.string().trim().min(1).max(120),
    rated_participant_id: z.number().int().positive().optional(),
    scores: likertScoresRecordSchema,
});

/**
 * Authenticated participant submit:
 * - `self_rating` / `peer_rating`: raw likert scores keyed by score id (same keys as questionnaire `short_labels`).
 * - Legacy shape (no `kind`): element humain, same as invite submit.
 */
export const submitParticipantQuestionnaireBodySchema = z.union([
    submitParticipantSelfRatingBodySchema,
    submitParticipantPeerRatingBodySchema,
    submitInviteQuestionnaireBodySchema,
]);

export type SubmitQuestionnaireBodyDto = z.infer<typeof submitQuestionnaireBodySchema>;
export type SubmitInviteQuestionnaireBodyDto = z.infer<typeof submitInviteQuestionnaireBodySchema>;
export type SubmitParticipantQuestionnaireBodyDto = z.infer<typeof submitParticipantQuestionnaireBodySchema>;
export type SubmitParticipantSelfRatingBodyDto = z.infer<typeof submitParticipantSelfRatingBodySchema>;
export type SubmitParticipantPeerRatingBodyDto = z.infer<typeof submitParticipantPeerRatingBodySchema>;
export type QuestionnaireInfoDto = z.infer<typeof questionnaireInfoSchema>;

// Aliases without Dto suffix — preferred for frontend use
export type SubmitParticipantElementHumainBody = SubmitInviteQuestionnaireBodyDto;
export type SubmitParticipantSelfRatingBody = SubmitParticipantSelfRatingBodyDto;
export type SubmitParticipantPeerRatingBody = SubmitParticipantPeerRatingBodyDto;
export type SubmitParticipantQuestionnaireBody = SubmitParticipantQuestionnaireBodyDto;
