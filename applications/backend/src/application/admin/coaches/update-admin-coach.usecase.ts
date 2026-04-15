import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type { CoachRecord,
    ICoachesReadPort, ICoachesWritePort,
    UpdateCoachCommand, } from '@src/interfaces/coaches/ICoachesRepository.port';
import type { IPasswordHasherPort } from '@aor/ports';

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
    ): Promise<Omit<CoachRecord, 'password'>> {
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

        let username = current.username;
        if (hasUsername) {
            const rawUsername = body.username;
            if (rawUsername === undefined) {
                throw new AdminValidationError('Le username du coach est requis.');
            }
            username = rawUsername.trim().toLowerCase();
            if (username.length < 3) {
                throw new AdminValidationError('Le username du coach doit contenir au moins 3 caractères.');
            }
            if (username !== current.username) {
                const taken = await this.ports.coaches.findByUsername(username);
                if (taken && taken.id !== coachId) {
                    throw new AdminValidationError('Ce username coach existe déjà.');
                }
            }
        }

        let newPassword: string | undefined;
        if (hasPassword) {
            const rawPassword = body.password ?? '';
            if (rawPassword.length < 6) {
                throw new AdminValidationError('Le mot de passe du coach doit contenir au moins 6 caractères.');
            }
            newPassword = rawPassword;
        }

        let displayName = current.displayName;
        if (hasDisplayName) {
            const rawDisplayName = body.display_name;
            if (rawDisplayName === undefined) {
                throw new AdminValidationError('Le nom affiché du coach est requis.');
            }
            displayName = rawDisplayName.trim();
            if (displayName.length < 2) {
                throw new AdminValidationError('Le nom affiché du coach doit contenir au moins 2 caractères.');
            }
        }

        const isActive = hasIsActive ? Boolean(body.is_active) : current.isActive;

        const patch: UpdateCoachCommand = {};
        if (hasUsername) {
            patch.username = username;
        }
        if (hasPassword && newPassword !== undefined) {
            patch.password = this.ports.passwordHasher.hash(newPassword);
        }
        if (hasDisplayName) {
            patch.displayName = displayName;
        }
        if (hasIsActive) {
            patch.isActive = isActive;
        }

        const updated = await this.ports.coaches.update(coachId, patch);
        if (!updated) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }
        const { password: _password, ...safe } = updated;
        return safe;
    }
}
