// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { randomBytes } from 'node:crypto';

import { createConsoleLogger } from '@aor/logger';
import { type IPasswordHasherPort, PASSWORD_HASHER_PORT_SYMBOL } from '@aor/ports';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';

import { Coach } from '@src/domain/coaches';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    COACHES_REPOSITORY_PORT_SYMBOL,
    type ICoachesReadPort,
    type ICoachesWritePort,
} from '@src/interfaces/coaches/ICoachesRepository.port';

const log = createConsoleLogger({ context: 'EnsureAdminCoach' });

/**
 * Garantit qu'une ligne sentinelle « Admin » existe dans `coachesTable` au démarrage de l'app.
 * Cette ligne sert uniquement de cible d'assignation des campagnes (point P01/P05) ; elle
 * n'est pas utilisable pour s'authentifier — le super-admin reste authentifié via les
 * credentials env (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).
 *
 * - Le `username` de la ligne admin = `superAdminUsername` (env `ADMIN_USERNAME`).
 * - Le hash de mot de passe est aléatoire et inutilisable : aucune valeur en clair connue.
 * - Idempotent : si la ligne existe déjà, on n'y touche pas (l'admin a pu modifier le
 *   `displayName` via la BDD, on respecte).
 */
@Injectable()
export class EnsureAdminCoachService implements OnModuleInit {
    public constructor(
        @Inject(COACHES_REPOSITORY_PORT_SYMBOL)
        private readonly coaches: ICoachesReadPort & ICoachesWritePort,
        @Inject(ADMIN_AUTH_CONFIG_PORT_SYMBOL)
        private readonly authConfig: IAdminAuthConfigPort,
        @Inject(PASSWORD_HASHER_PORT_SYMBOL)
        private readonly hasher: IPasswordHasherPort
    ) {}

    public async onModuleInit(): Promise<void> {
        const username = this.authConfig.superAdminUsername;
        const existing = await this.coaches.findByUsername(username);
        if (existing) {
            return;
        }
        const unusablePassword = randomBytes(48).toString('base64url');
        const draft = Coach.create({
            username,
            passwordHash: this.hasher.hash(unusablePassword),
            displayName: 'Admin',
        });
        await this.coaches.create(draft);
        log.info("Compte coach Admin créé (cible d'assignation des campagnes)", { username });
    }
}
