// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IPasswordHasherPort } from '@aor/ports';

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { Coach } from '@src/domain/coaches';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class UpdateAdminCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort & ICoachesWritePort;
            readonly passwordHasher: IPasswordHasherPort;
        }
    ) {}

    public async execute(
        coachId: number,
        body: {
            username?: string;
            password?: string;
            display_name?: string;
            is_active?: boolean;
        }
    ): Promise<Coach> {
        const current = await this.ports.coaches.findById(coachId);
        if (!current) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }

        const hasUsername = body.username !== undefined;
        const hasPassword = body.password !== undefined;
        const hasDisplayName = body.display_name !== undefined;
        const hasIsActive = body.is_active !== undefined;
        if (!hasUsername && !hasPassword && !hasDisplayName && !hasIsActive) {
            throw new AdminValidationError('Aucun champ à mettre à jour.');
        }

        let next = current;

        if (hasUsername) {
            const raw = body.username ?? '';
            next = next.rename(raw);
            if (next.username !== current.username) {
                const taken = await this.ports.coaches.findByUsername(next.username);
                if (taken && taken.id !== coachId) {
                    throw new AdminValidationError('Ce username coach existe déjà.');
                }
            }
        }

        if (hasPassword) {
            const raw = body.password ?? '';
            if (raw.length < 6) {
                throw new AdminValidationError('Le mot de passe du coach doit contenir au moins 6 caractères.');
            }
            next = next.changePasswordHash(this.ports.passwordHasher.hash(raw));
        }

        if (hasDisplayName) {
            next = next.changeDisplayName(body.display_name ?? '');
        }

        if (hasIsActive) {
            next = next.setActive(Boolean(body.is_active));
        }

        const saved = await this.ports.coaches.save(next);
        if (!saved) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        return saved;
    }
}
