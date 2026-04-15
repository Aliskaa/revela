import type { QuestionnaireId } from "@aor/types";

import { QUESTIONNAIRE_RULES, QUESTIONNAIRE_SCORE_KEYS, SCORE_GROUPS, type ScoreFunction } from "./constants";

export interface ScorePersistencePort {
  saveScores(input: {
    questionnaireId: QuestionnaireId;
    scores: Record<number, number>;
  }): Promise<void>;
}

const scoreQuestion = (answer: number, threshold: number, fn: ScoreFunction): number => {
  if (fn === "ge") {
    return answer >= threshold ? 1 : 0;
  }

  return answer <= threshold ? 1 : 0;
};

const assertAnswers = (answers: readonly number[], label: string): void => {
  if (answers.length !== 54) {
    throw new Error(`${label} must contain exactly 54 answers.`);
  }

  for (const value of answers) {
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error(`${label} values must be integers between 0 and 5.`);
    }
  }
};

export const calculateScores = (
  questionnaireId: QuestionnaireId,
  series0: readonly number[],
  series1: readonly number[],
): Record<number, number> => {
  assertAnswers(series0, "series0");
  assertAnswers(series1, "series1");

  const scores: Record<number, number> = {};
  const rules = QUESTIONNAIRE_RULES[questionnaireId];
  const scoreKeys = QUESTIONNAIRE_SCORE_KEYS[questionnaireId];

  for (const scoreKey of scoreKeys) {
    const seriesIndex = scoreKey % 2 === 0 ? 1 : 0;
    const answers = seriesIndex === 0 ? series0 : series1;
    const indices = SCORE_GROUPS[scoreKey];

    let total = 0;
    for (const idx1 of indices) {
      const rule = rules[idx1 - 1];
      total += scoreQuestion(answers[idx1 - 1] ?? 0, rule.threshold, rule.function);
    }

    scores[scoreKey] = total;
  }

  return scores;
};
