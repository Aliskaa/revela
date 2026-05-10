/**
 * Schémas Zod du harness — §5 (entrée) et §6 (objet intermédiaire).
 *
 * §5 = ce que le backend produit à partir des saisies du participant.
 *      Validation stricte : aucune donnée ne passe au reste du pipeline
 *      sans avoir traversé `harnessInputSchema`.
 *
 * §6 = ce que le harness transmet effectivement au modèle. Volontairement
 *      réduit (≤ 2 dimensions, instructions de style) pour éviter que le
 *      LLM extrapole sur des données qu'il n'a pas reçues.
 */
import { z } from 'zod';

import {
    BEHAVIORAL_DIMENSIONS,
    DEFAULT_FORBIDDEN_PHRASES,
    DEFAULT_GAP_THRESHOLD,
    DEFAULT_HYPOTHESIS_MARKERS,
    DEFAULT_MAX_WORDS,
    DEFAULT_TONE,
    FIRO_SCORE_MAX,
    FIRO_SCORE_MIN,
    MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP,
    OUTPUT_SECTIONS,
    TRANSPARENCY_SCORE_MAX,
    TRANSPARENCY_SCORE_MIN,
} from './constants';

const firoScoreSchema = z.number().int().min(FIRO_SCORE_MIN).max(FIRO_SCORE_MAX);

const dimensionScoresSchema = z.object({
    expressed: firoScoreSchema,
    wanted: firoScoreSchema,
    peer_feedback: firoScoreSchema,
});

export type DimensionScores = z.infer<typeof dimensionScoresSchema>;

const transparencyScoresSchema = z.object({
    score: z.number().int().min(TRANSPARENCY_SCORE_MIN).max(TRANSPARENCY_SCORE_MAX),
});

const generationRulesSchema = z.object({
    max_words: z.number().int().positive().default(DEFAULT_MAX_WORDS),
    min_gap: z.number().int().nonnegative().default(DEFAULT_GAP_THRESHOLD),
    max_behavioral_dimensions: z
        .number()
        .int()
        .min(0)
        .max(MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP)
        .default(MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP),
    output_sections: z.array(z.enum(OUTPUT_SECTIONS)).default([...OUTPUT_SECTIONS]),
});

/**
 * Schéma §5 — entrée du harness produite par le backend.
 *
 * `participant_id` est optionnel pour faciliter les tests : en production
 * il est toujours fourni, mais le harness lui-même n'en a pas besoin pour
 * sélectionner les dimensions.
 */
export const harnessInputSchema = z.object({
    module: z.literal('firo_b_short_restitution'),
    language: z.literal('fr'),
    participant_id: z.string().optional(),
    scores: z.object({
        inclusion: dimensionScoresSchema,
        control: dimensionScoresSchema,
        openness: dimensionScoresSchema,
        transparency: transparencyScoresSchema,
    }),
    generation_rules: generationRulesSchema.default(generationRulesSchema.parse({})),
});

export type HarnessInput = z.infer<typeof harnessInputSchema>;

/**
 * Raison d'admission d'une dimension dans la sélection §4.
 * - `ecart_exprime_desire` : |expressed − wanted| ≥ seuil
 * - `ecart_auto_feedback`  : |expressed − peer_feedback| ≥ seuil
 *
 * Si les deux conditions sont remplies, on retient la raison correspondant
 * au gap le plus fort (cf. `select-dimensions.ts`).
 */
export const selectionReasonSchema = z.enum(['ecart_exprime_desire', 'ecart_auto_feedback']);

export type SelectionReason = z.infer<typeof selectionReasonSchema>;

const selectedDimensionSchema = z.object({
    name: z.enum(BEHAVIORAL_DIMENSIONS),
    reason: selectionReasonSchema,
    expressed: firoScoreSchema,
    wanted: firoScoreSchema,
    peer_feedback: firoScoreSchema,
    gap: z.number().int().nonnegative(),
    interpretation_instruction: z.string().min(1),
});

export type SelectedDimension = z.infer<typeof selectedDimensionSchema>;

const styleConstraintsSchema = z.object({
    tone: z.string().min(1).default(DEFAULT_TONE),
    max_words: z.number().int().positive().default(DEFAULT_MAX_WORDS),
    forbidden_phrases: z.array(z.string().min(1)).default([...DEFAULT_FORBIDDEN_PHRASES]),
    required_hypothesis_markers: z.array(z.string().min(1)).default([...DEFAULT_HYPOTHESIS_MARKERS]),
});

export type StyleConstraints = z.infer<typeof styleConstraintsSchema>;

const transparencyBlockSchema = z.object({
    score: z.number().int().min(TRANSPARENCY_SCORE_MIN).max(TRANSPARENCY_SCORE_MAX),
    instruction: z.string().min(1),
});

/**
 * Schéma §6 — objet intermédiaire effectivement transmis au modèle.
 * Volontairement plus court que l'input : seules les dimensions retenues
 * sont citées, pour éviter que le modèle commente des dimensions non
 * fournies (le validateur §9 sanctionne cette transgression).
 */
export const intermediateObjectSchema = z.object({
    selected_dimensions: z.array(selectedDimensionSchema).max(MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP),
    transparency: transparencyBlockSchema,
    style_constraints: styleConstraintsSchema,
});

export type IntermediateObject = z.infer<typeof intermediateObjectSchema>;

/**
 * Helper : valide un payload brut (typiquement un body HTTP) et renvoie
 * un `HarnessInput` exploitable. Lève une `ZodError` en cas d'échec —
 * à transformer en HTTP 400 par le controller appelant.
 */
export const parseHarnessInput = (raw: unknown): HarnessInput => {
    return harnessInputSchema.parse(raw);
};
