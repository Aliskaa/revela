// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IPasswordHasherPort } from '@aor/ports';

import { AdminValidationError } from '@src/domain/admin/admin.errors';
import { Coach } from '@src/domain/coaches';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class CreateAdminCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort & ICoachesWritePort;
            readonly passwordHasher: IPasswordHasherPort;
        }
    ) {}

    public async execute(body: { username?: string; password?: string; display_name?: string }): Promise<Coach> {
        const password = body.password ?? '';
        if (password.length < 6) {
            throw new AdminValidationError('Le mot de passe du coach doit contenir au moins 6 caractères.');
        }

        const draft = Coach.create({
            username: body.username ?? '',
            passwordHash: this.ports.passwordHasher.hash(password),
            displayName: body.display_name ?? '',
        });

        const existing = await this.ports.coaches.findByUsername(draft.username);
        if (existing) {
            throw new AdminValidationError('Ce username coach existe déjà.');
        }

        return this.ports.coaches.create(draft);
    }
}
