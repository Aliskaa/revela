import type { QuestionnaireId } from "@aor/types";

export type ScoreFunction = "ge" | "le";

export interface ScoreRule {
  threshold: number;
  function: ScoreFunction;
}

export const SCORE_GROUPS: Record<number, readonly number[]> = {
  11: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  12: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  13: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  14: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  21: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  22: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  23: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  24: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  31: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  32: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  33: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  34: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  41: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  42: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  43: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  44: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  51: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  52: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  53: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  54: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  61: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  62: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  63: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  64: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  15: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  16: [1, 7, 13, 19, 25, 31, 37, 43, 49],
  25: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  26: [2, 8, 14, 20, 26, 32, 38, 44, 50],
  35: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  36: [3, 9, 15, 21, 27, 33, 39, 45, 51],
  45: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  46: [4, 10, 16, 22, 28, 34, 40, 46, 52],
  55: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  56: [5, 11, 17, 23, 29, 35, 41, 47, 53],
  65: [6, 12, 18, 24, 30, 36, 42, 48, 54],
  66: [6, 12, 18, 24, 30, 36, 42, 48, 54],
};

export const QUESTIONNAIRE_SCORE_KEYS: Record<QuestionnaireId, readonly number[]> = {
  B: [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34],
  F: [41, 42, 43, 44, 51, 52, 53, 54, 61, 62, 63, 64],
  S: [15, 16, 25, 26, 35, 36, 45, 46, 55, 56, 65, 66],
};

export const QUESTIONNAIRE_RULES: Record<QuestionnaireId, readonly ScoreRule[]> = {
  B: [{"threshold":2,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"ge"},{"threshold":2,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":2,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":1,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"ge"}],
  F: [{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":0,"function":"le"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":-1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":2,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"}],
  S: [{"threshold":4,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":4,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":2,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":2,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":-1,"function":"le"},{"threshold":2,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":3,"function":"ge"},{"threshold":0,"function":"le"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":1,"function":"le"},{"threshold":0,"function":"le"},{"threshold":1,"function":"ge"},{"threshold":-1,"function":"le"},{"threshold":3,"function":"ge"},{"threshold":4,"function":"ge"}],
};
