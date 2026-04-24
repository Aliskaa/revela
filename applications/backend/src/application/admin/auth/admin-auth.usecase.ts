/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { AdminLoginResult } from '@aor/domain';
import type { IPasswordVerifierPort } from '@aor/ports';
import { AdminInvalidCredentialsError } from '@src/domain/admin/admin.errors';
import type { IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import type { IAdminTokenSignerPort } from '@src/interfaces/admin/IAdminTokenSigner.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class AdminAuthUseCase {
    public constructor(
        private readonly ports: {
            readonly authConfig: IAdminAuthConfigPort;
            readonly tokenSigner: IAdminTokenSignerPort;
            readonly coaches: ICoachesReadPort;
            readonly passwordVerifier: IPasswordVerifierPort;
        }
    ) {}

    public async login(usernameRaw: string, passwordRaw: string): Promise<AdminLoginResult> {
        const username = usernameRaw.trim();
        const password = passwordRaw;
        if (
            username === this.ports.authConfig.superAdminUsername &&
            password === this.ports.authConfig.superAdminPassword
        ) {
            return AdminLoginResult.create(
                this.ports.tokenSigner.sign({ sub: username, role: 'admin', scope: 'super-admin' })
            );
        }

        const coach = await this.ports.coaches.findByUsername(username);
        if (
            !coach ||
            !coach.isActive ||
            !this.ports.passwordVerifier.verifyOrPlaintextLegacy(password, coach.password)
        ) {
            throw new AdminInvalidCredentialsError();
        }

        return AdminLoginResult.create(
            this.ports.tokenSigner.sign({ sub: coach.username, role: 'admin', scope: 'coach', coachId: coach.id })
        );
    }
}
