import { z } from 'zod';

export const companySchema = z.object({
    id: z.number().int(),
    name: z.string(),
    contact_name: z.string().nullable(),
    contact_email: z.string().nullable(),
    participant_count: z.number().int(),
    avatar_url: z.string().nullable(),
});
export type Company = z.infer<typeof companySchema>;

/**
 * Validation au bord (ADR-009 §1) pour la création et la mise à jour d'une entreprise.
 * Forme transport uniquement ; l'unicité du nom et le caractère requis du nom sont
 * vérifiés dans les use cases.
 */
export const adminCompanyMutationBodySchema = z.object({
    name: z.string().optional(),
    contact_name: z.string().nullable().optional(),
    contact_email: z.string().nullable().optional(),
});
export type AdminCompanyMutationBody = z.infer<typeof adminCompanyMutationBodySchema>;
