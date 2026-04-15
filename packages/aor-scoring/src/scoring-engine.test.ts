import assert from "node:assert/strict";
import test from "node:test";

import type { QuestionnaireId } from "@aor/types";

import { calculateScores } from "./scoring-engine";

const answers = (value: number): number[] => Array.from({ length: 54 }, () => value);

const expectedKeys: Record<QuestionnaireId, number[]> = {
  B: [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34],
  F: [41, 42, 43, 44, 51, 52, 53, 54, 61, 62, 63, 64],
  S: [15, 16, 25, 26, 35, 36, 45, 46, 55, 56, 65, 66],
  C: [41, 42, 43, 44, 51, 52, 53, 54, 61, 62, 63, 64],
};

for (const questionnaireId of ["B", "F", "S", "C"] as const) {
  test(`${questionnaireId}: returns 12 scores`, () => {
    const scores = calculateScores(questionnaireId, answers(3), answers(3));
    assert.equal(Object.keys(scores).length, 12);
  });

  test(`${questionnaireId}: expected score keys`, () => {
    const scores = calculateScores(questionnaireId, answers(3), answers(3));
    const keys = Object.keys(scores).map((value) => Number(value));
    assert.deepEqual(new Set(keys), new Set(expectedKeys[questionnaireId]));
  });

  test(`${questionnaireId}: scores are always in 0..9`, () => {
    for (const value of [0, 1, 3, 5]) {
      const scores = calculateScores(questionnaireId, answers(value), answers(value));
      assert.equal(
        Object.values(scores).every((score) => score >= 0 && score <= 9),
        true,
      );
    }
  });
}

test("B: series are independent", () => {
  const scores0 = calculateScores("B", answers(5), answers(0));
  const scores1 = calculateScores("B", answers(0), answers(5));
  assert.notDeepEqual(scores0, scores1);
});

test("C and F share the same score keys", () => {
  const scoresF = calculateScores("F", answers(3), answers(3));
  const scoresC = calculateScores("C", answers(3), answers(3));
  assert.deepEqual(
    new Set(Object.keys(scoresF).map((value) => Number(value))),
    new Set(Object.keys(scoresC).map((value) => Number(value))),
  );
});

test("throws on invalid answer shape", () => {
  assert.throws(() => calculateScores("B", [1, 2, 3], answers(3)));
  assert.throws(() => calculateScores("B", answers(3), [...answers(3).slice(0, 53), 6]));
});
