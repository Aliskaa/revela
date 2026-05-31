import { z } from 'zod';
import { campaignStatusSchema, progressStatusSchema } from './api-common';

export const participantFunctionLevelSchema = z.enum(['direction', 'middle_management', 'frontline_manager']);
export type ParticipantFunctionLevel = z.infer<typeof participantFunctionLevelSchema>;

export const participantSchema = z.object({
    id: z.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    email: z.string(),
    company: z.object({ id: z.number().int(), name: z.string() }).nullable(),
    organisation: z.string().nullable(),
    direction: z.string().nullable(),
    service: z.string().nullable(),
    function_level: participantFunctionLevelSchema.nullable(),
    avatar_url: z.string().nullable(),
    created_at: z.string().nullable(),
    /**
     * Coach ayant créé ce participant via un ajout unitaire (drawer fiche entreprise ou
     * fiche campagne). `null` quand créé par admin (CSV). Sert au contrôle d'accès suppression
     * côté coach (cf. PDF AOR §coach delete).
     */
    created_by_coach_id: z.number().int().nullable(),
    invite_status: z.record(z.string(), z.string()),
    response_count: z.number().int(),
});
export type Participant = z.infer<typeof participantSchema>;

export const participantCampaignAssignmentSchema = z.object({
    campaign_id: z.number().int(),
    campaign_name: z.string(),
    status: z.string(),
    company_id: z.number().int().nullable(),
    company_name: z.string().nullable(),
    invited_at: z.string().nullable(),
    joined_at: z.string().nullable(),
});
export type ParticipantCampaignAssignment = z.infer<typeof participantCampaignAssignmentSchema>;

export const participantDetailSchema = z.object({
    participant: participantSchema,
    campaigns: z.array(participantCampaignAssignmentSchema),
});
export type ParticipantDetail = z.infer<typeof participantDetailSchema>;

export const campaignPeerChoiceSchema = z.object({
    participant_id: z.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    avatar_url: z.string().nullable(),
});
export type CampaignPeerChoice = z.infer<typeof campaignPeerChoiceSchema>;

const participantSessionProgressionSchema = z.object({
    self_rating_status: progressStatusSchema,
    peer_feedback_status: progressStatusSchema,
    element_humain_status: progressStatusSchema,
    feedback_coach: z.string().nullable(),
    /**
     * Nombre de feedbacks pairs déjà saisis par le participant pour cette campagne.
     * Utilisé pour piloter l'affichage du bouton « J'ai terminé mes feedbacks » et
     * vérifier la règle métier (au moins 1 pour confirmer ; auto-complete au 5e).
     */
    peer_ratings_count: z.number().int().min(0).default(0),
});

const participantSessionAssignmentSchema = z.object({
    campaign_id: z.number().int().nullable(),
    campaign_name: z.string().nullable(),
    company_id: z.number().int().nullable(),
    company_name: z.string().nullable(),
    coach_id: z.number().int().nullable(),
    coach_name: z.string().nullable(),
    questionnaire_id: z.string(),
    questionnaire_title: z.string(),
    campaign_status: campaignStatusSchema.nullable(),
    allow_test_without_manual_inputs: z.boolean(),
    invitation_confirmed: z.boolean(),
    progression: participantSessionProgressionSchema.nullable(),
});

export const participantSessionSchema = z.object({
    participant_id: z.number().int(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    organisation: z.string().nullable(),
    direction: z.string().nullable(),
    service: z.string().nullable(),
    function_level: participantFunctionLevelSchema.nullable(),
    avatar_url: z.string().nullable(),
    assignments: z.array(participantSessionAssignmentSchema),
});
export type ParticipantSession = z.infer<typeof participantSessionSchema>;

export const updateParticipantProfileBodySchema = z.object({
    organisation: z.string().max(255).nullable().optional(),
    direction: z.string().max(255).nullable().optional(),
    service: z.string().max(255).nullable().optional(),
    function_level: participantFunctionLevelSchema.nullable().optional(),
});
export type UpdateParticipantProfileBody = z.infer<typeof updateParticipantProfileBodySchema>;

/**
 * Réponse de l'endpoint `POST /participant/campaigns/:campaignId/peer-feedback/confirm`
 * (cf. P12/P13 du suivi produit). Le statut peer_feedback passe à `completed` côté backend ;
 * `unlockedElementHumain` indique si l'étape suivante (test) a été débloquée par cette
 * confirmation.
 */
export const confirmPeerFeedbackResponseSchema = z.object({
    confirmed: z.literal(true),
    wasAlreadyCompleted: z.boolean(),
    unlockedElementHumain: z.boolean(),
});
export type ConfirmPeerFeedbackResponse = z.infer<typeof confirmPeerFeedbackResponseSchema>;
