import { z } from 'zod';

export const QUESTIONNAIRE_IDS = ['B', 'F', 'S'] as const;
export type QuestionnaireId = (typeof QUESTIONNAIRE_IDS)[number];

const answerValueSchema = z.int().min(0).max(5);
const answerSeriesSchema = z.array(answerValueSchema).length(54);

export const calculateScoringRequestDtoSchema = z.object({
    questionnaireId: z.enum(QUESTIONNAIRE_IDS),
    series0: answerSeriesSchema,
    series1: answerSeriesSchema,
});

export const scoreItemDtoSchema = z.object({
    scoreKey: z.int(),
    value: z.int().min(0).max(9),
});

export const calculateScoringResponseDtoSchema = z.object({
    questionnaireId: z.enum(QUESTIONNAIRE_IDS),
    scores: z.array(scoreItemDtoSchema).length(12),
});

export type CalculateScoringRequestDto = z.infer<typeof calculateScoringRequestDtoSchema>;
export type ScoreItemDto = z.infer<typeof scoreItemDtoSchema>;
export type CalculateScoringResponseDto = z.infer<typeof calculateScoringResponseDtoSchema>;
