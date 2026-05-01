import { z } from 'zod';

import { participantFunctionLevelSchema } from './participant';

/**
 * Format de l'export RGPD « mes données » du participant (Articles 15 et 20 RGPD).
 * Agrège l'ensemble des données personnelles directement liées au participant :
 * profil, métadonnées RH, assignations, jetons d'invitation, et toutes les réponses
 * dans lesquelles il est impliqué (sujet, évaluateur ou évalué).
 *
 * Ce schéma fait office de contrat stable côté frontend pour la génération du PDF
 * et du téléchargement JSON. Toute modification ici doit être reflétée dans
 * `lib/exportParticipantData.ts` (génération du PDF).
 */
export const participantExportProfileSchema = z.object({
    participant_id: z.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    organisation: z.string().nullable(),
    direction: z.string().nullable(),
    service: z.string().nullable(),
    function_level: participantFunctionLevelSchema.nullable(),
    company: z.object({ id: z.number().int(), name: z.string() }).nullable(),
});
export type ParticipantExportProfile = z.infer<typeof participantExportProfileSchema>;

export const participantExportCampaignSchema = z.object({
    campaign_id: z.number().int().nullable(),
    campaign_name: z.string().nullable(),
    questionnaire_id: z.string(),
    invited_at: z.string().nullable(),
    joined_at: z.string().nullable(),
});
export type ParticipantExportCampaign = z.infer<typeof participantExportCampaignSchema>;

export const participantExportInviteTokenSchema = z.object({
    token_id: z.number().int(),
    questionnaire_id: z.string().nullable(),
    campaign_id: z.number().int().nullable(),
    is_active: z.boolean(),
    used_at: z.string().nullable(),
    expires_at: z.string().nullable(),
});
export type ParticipantExportInviteToken = z.infer<typeof participantExportInviteTokenSchema>;

export const participantExportResponseRoleSchema = z.enum(['subject', 'rater', 'rated', 'submitter']);
export type ParticipantExportResponseRole = z.infer<typeof participantExportResponseRoleSchema>;

export const participantExportResponseSchema = z.object({
    response_id: z.number().int(),
    questionnaire_id: z.string(),
    submission_kind: z.string(),
    role: participantExportResponseRoleSchema,
    campaign_id: z.number().int().nullable(),
    submitted_at: z.string().nullable(),
    name_at_submission: z.string(),
    email_at_submission: z.string(),
    organisation_at_submission: z.string().nullable(),
});
export type ParticipantExportResponse = z.infer<typeof participantExportResponseSchema>;

export const participantSelfDataExportSchema = z.object({
    /** ISO 8601 instant de génération de l'export. */
    generated_at: z.string(),
    /** Numéro de version du format d'export, utile pour les évolutions futures. */
    format_version: z.literal('1.0'),
    profile: participantExportProfileSchema,
    campaigns: z.array(participantExportCampaignSchema),
    responses: z.array(participantExportResponseSchema),
});
export type ParticipantSelfDataExport = z.infer<typeof participantSelfDataExportSchema>;
