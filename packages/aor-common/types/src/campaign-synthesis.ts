// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { z } from 'zod';
import { resultDimSchema } from './questionnaire';

/**
 * Vue de synthèse Élément B (test scientifique) au niveau d'une campagne.
 * Colonnes = participants, lignes = score_keys du catalogue regroupés par dimension,
 * complétées par des lignes d'écart (paires e/w issues de `result_dims.diff_pairs`).
 *
 * Cf. PDF AOR section 9 — « Vue globale parcours : tableau de synthèse Élément B uniquement ».
 */

export const synthesisParticipantColumnSchema = z.object({
    participantId: z.number().int(),
    fullName: z.string(),
    email: z.string(),
    /** `true` si une réponse `element_humain` existe pour ce couple (campagne, participant). */
    hasResponse: z.boolean(),
});
export type CampaignSynthesisParticipantColumn = z.infer<typeof synthesisParticipantColumnSchema>;

/** Ligne de score brute : une question par dimension. */
export const synthesisScoreRowSchema = z.object({
    scoreKey: z.number().int(),
    label: z.string(),
    /** Aligné par index sur `participants[]`. `null` quand le participant n'a pas répondu. */
    values: z.array(z.number().nullable()),
});
export type CampaignSynthesisScoreRow = z.infer<typeof synthesisScoreRowSchema>;

/** Cellule d'écart : valeur absolue |e − w| pour un participant donné, avec drapeau d'alerte. */
export const synthesisGapCellSchema = z.object({
    value: z.number().nullable(),
    /** `true` quand `value > 4` — alerte écart fort à mettre en couleur côté UI. */
    warning: z.boolean(),
});
export type CampaignSynthesisGapCell = z.infer<typeof synthesisGapCellSchema>;

/** Ligne d'écart : pour une paire (e_score_key, w_score_key) du catalogue. */
export const synthesisGapRowSchema = z.object({
    eScoreKey: z.number().int(),
    wScoreKey: z.number().int(),
    label: z.string(),
    /** Aligné par index sur `participants[]`. */
    cells: z.array(synthesisGapCellSchema),
});
export type CampaignSynthesisGapRow = z.infer<typeof synthesisGapRowSchema>;

/** Bloc d'une dimension du catalogue (Inclusion / Contrôle / Ouverture pour Élément B). */
export const synthesisDimensionSchema = z.object({
    name: z.string(),
    rows: z.array(synthesisScoreRowSchema),
    gaps: z.array(synthesisGapRowSchema),
});
export type CampaignSynthesisDimension = z.infer<typeof synthesisDimensionSchema>;

export const campaignSynthesisMatrixSchema = z.object({
    campaignId: z.number().int(),
    campaignName: z.string(),
    questionnaireId: z.string(),
    questionnaireTitle: z.string(),
    /** Seuil retenu pour le drapeau `warning` sur les écarts. */
    gapWarningThreshold: z.number().int(),
    participants: z.array(synthesisParticipantColumnSchema),
    dimensions: z.array(synthesisDimensionSchema),
    /** Catalogue propagé pour permettre d'autres affichages côté UI sans re-fetch. */
    resultDims: z.array(resultDimSchema),
});
export type CampaignSynthesisMatrix = z.infer<typeof campaignSynthesisMatrixSchema>;
