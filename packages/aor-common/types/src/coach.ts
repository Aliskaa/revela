import { z } from 'zod';
import { campaignStatusSchema } from './api-common';

export const coachSchema = z.object({
    id: z.number().int(),
    username: z.string(),
    displayName: z.string(),
    isActive: z.boolean(),
    avatar_url: z.string().nullable(),
    createdAt: z.string().nullable(),
    /**
     * `true` pour la ligne sentinelle « Admin » (cible d'assignation des campagnes
     * détenues par l'admin). Cette ligne ne peut être ni éditée ni supprimée via l'UI.
     */
    isAdmin: z.boolean().default(false),
});
export type Coach = z.infer<typeof coachSchema>;

export const adminCoachLinkedCampaignSchema = z.object({
    id: z.number().int(),
    coachId: z.number().int(),
    companyId: z.number().int(),
    name: z.string(),
    questionnaireId: z.string().nullable(),
    status: campaignStatusSchema,
    allowTestWithoutManualInputs: z.boolean(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    createdAt: z.string().nullable(),
});
export type AdminCoachLinkedCampaign = z.infer<typeof adminCoachLinkedCampaignSchema>;

export const adminCoachDetailSchema = z.object({
    coach: coachSchema,
    campaigns: z.array(adminCoachLinkedCampaignSchema),
});
export type AdminCoachDetail = z.infer<typeof adminCoachDetailSchema>;

/**
 * Validation au bord (ADR-009 §1) pour la création et la mise à jour d'un coach.
 * Forme transport uniquement ; la longueur du mot de passe, le username réservé et
 * l'unicité sont vérifiés dans les use cases.
 */
export const createAdminCoachBodySchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    display_name: z.string().optional(),
});
export type CreateAdminCoachBody = z.infer<typeof createAdminCoachBodySchema>;

export const updateAdminCoachBodySchema = createAdminCoachBodySchema.extend({
    is_active: z.boolean().optional(),
});
export type UpdateAdminCoachBody = z.infer<typeof updateAdminCoachBodySchema>;
