// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
        if (!coach || !coach.isActive || !coach.verifyPassword(password, this.ports.passwordVerifier)) {
            throw new AdminInvalidCredentialsError();
        }

        return AdminLoginResult.create(
            this.ports.tokenSigner.sign({ sub: coach.username, role: 'admin', scope: 'coach', coachId: coach.id })
        );
    }
}
