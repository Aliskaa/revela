// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Résultat d'une authentification admin (super-admin ou coach).
 *
 * Le `scope` indique le rôle effectif :
 * - `super-admin` : accès global à la plateforme (champ `coachId` toujours `null`).
 * - `coach` : accès restreint au périmètre du coach (champ `coachId` renseigné, sert
 *   à filtrer les ressources côté backend et à router le frontend vers `/coach`
 *   plutôt que `/admin`).
 *
 * Cf. [docs/avancement-2026-04-28.md](../../../docs/avancement-2026-04-28.md) §3
 * pour la justification de l'exposition explicite du scope (vs décodage JWT côté
 * frontend).
 */
export type AdminLoginScope = 'super-admin' | 'coach';

export class AdminLoginResult {
    private constructor(
        public readonly accessToken: string,
        public readonly scope: AdminLoginScope,
        public readonly coachId: number | null
    ) {
        Object.freeze(this);
    }

    public static createSuperAdmin(accessToken: string): AdminLoginResult {
        return new AdminLoginResult(accessToken, 'super-admin', null);
    }

    public static createCoach(accessToken: string, coachId: number): AdminLoginResult {
        return new AdminLoginResult(accessToken, 'coach', coachId);
    }
}
