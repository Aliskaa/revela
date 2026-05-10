import { z } from 'zod';

/**
 * Statuts du cycle de vie d'une restitution IA — miroir de l'enum Postgres
 * `ai_restitution_status` (cf. PDF Marius §3 / §10).
 *
 * - `generated` : sortie LLM validée par le harness §9. Visible côté coach.
 * - `edited`    : le coach a modifié le Markdown.
 * - `approved`  : le coach a validé. Diffusé au participant.
 * - `rejected`  : sortie inutilisable, non diffusée.
 */
export const aiRestitutionStatusSchema = z.enum(['generated', 'edited', 'approved', 'rejected']);

export type AiRestitutionStatus = z.infer<typeof aiRestitutionStatusSchema>;

/**
 * Échec individuel du validateur §9 — code + détail texte.
 * Aligné sur `ValidationFailureCode` de `@aor/ai-harness`.
 */
export const aiRestitutionValidationFailureSchema = z.object({
    code: z.enum([
        'length_exceeded',
        'missing_section',
        'forbidden_phrase',
        'missing_hypothesis_markers',
        'unauthorized_dimension',
        'wrong_question_count',
    ]),
    detail: z.string(),
});

export type AiRestitutionValidationFailure = z.infer<typeof aiRestitutionValidationFailureSchema>;

/**
 * Rapport de validation persisté avec la restitution. `null` quand le texte
 * n'a pas encore été validé ou quand la dernière validation est passée
 * (`failures = []`).
 */
export const aiRestitutionValidationReportSchema = z.object({
    ok: z.boolean(),
    word_count: z.number().int().nonnegative(),
    failures: z.array(aiRestitutionValidationFailureSchema),
    validated_at: z.string(),
});

export type AiRestitutionValidationReport = z.infer<typeof aiRestitutionValidationReportSchema>;

/**
 * Vue admin/coach : restitution complète, audit-friendly. Inclut
 * `intermediate_json` (objet §6) et `raw_output` pour la traçabilité.
 */
export const aiRestitutionAdminViewSchema = z.object({
    id: z.number().int(),
    campaign_id: z.number().int(),
    participant_id: z.number().int(),
    status: aiRestitutionStatusSchema,
    model: z.string(),
    prompt_version: z.string(),
    selected_dimensions: z.array(
        z.object({
            name: z.enum(['inclusion', 'control', 'openness']),
            reason: z.enum(['ecart_exprime_desire', 'ecart_auto_feedback']),
            gap: z.number().int().nonnegative(),
        })
    ),
    raw_output: z.string(),
    edited_output: z.string().nullable(),
    validation_report: aiRestitutionValidationReportSchema.nullable(),
    regen_attempts: z.number().int().nonnegative(),
    generated_at: z.string(),
    approved_at: z.string().nullable(),
    approved_by_coach_id: z.number().int().nullable(),
    updated_at: z.string(),
});

export type AiRestitutionAdminView = z.infer<typeof aiRestitutionAdminViewSchema>;

/**
 * Vue participant : minimaliste. Aucune donnée d'audit, pas de raw_output —
 * uniquement le texte que le coach a approuvé. Le endpoint participant
 * renvoie 404 tant que `status !== 'approved'`.
 */
export const aiRestitutionParticipantViewSchema = z.object({
    campaign_id: z.number().int(),
    text: z.string(),
    approved_at: z.string(),
});

export type AiRestitutionParticipantView = z.infer<typeof aiRestitutionParticipantViewSchema>;

/** Body de l'endpoint d'édition coach (PUT) — Markdown libre. */
export const editAiRestitutionBodySchema = z.object({
    edited_output: z.string().min(1).max(20000),
});

export type EditAiRestitutionBody = z.infer<typeof editAiRestitutionBodySchema>;

/** Enveloppe de réponse uniforme côté admin. */
export const aiRestitutionAdminEnvelopeSchema = z.object({
    restitution: aiRestitutionAdminViewSchema.nullable(),
});

export type AiRestitutionAdminEnvelope = z.infer<typeof aiRestitutionAdminEnvelopeSchema>;
