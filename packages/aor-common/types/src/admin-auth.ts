// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { z } from 'zod';

/**
 * Scope effectif d'un admin authentifié, exposé dans la réponse de
 * `POST /admin/auth/login`. Sert au frontend à rediriger l'utilisateur vers
 * `/admin` (super-admin) ou `/coach` (coach connecté).
 *
 * Le contrat est volontairement séparé du JWT : le frontend n'a pas besoin de
 * décoder le token pour router. Cf. [docs/avancement-2026-04-28.md](../../../../docs/avancement-2026-04-28.md) §3
 * décision 1.
 */
export const adminLoginScopeSchema = z.enum(['super-admin', 'coach']);
export type AdminLoginScope = z.infer<typeof adminLoginScopeSchema>;

export const adminLoginResponseSchema = z.object({
    access_token: z.string(),
    scope: adminLoginScopeSchema,
    /** `null` pour super-admin, identifiant du coach pour scope=coach. */
    coach_id: z.number().int().positive().nullable(),
});
export type AdminLoginResponse = z.infer<typeof adminLoginResponseSchema>;
