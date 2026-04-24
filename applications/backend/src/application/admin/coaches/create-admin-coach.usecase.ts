import type { IPasswordHasherPort } from '@aor/ports';
import { AdminValidationError } from '@src/domain/admin/admin.errors';
import type { ICoachesReadPort, ICoachesWritePort } from '@src/interfaces/coaches/ICoachesRepository.port';

export class CreateAdminCoachUseCase {
    public constructor(
        private readonly ports: {
            readonly coaches: ICoachesReadPort & ICoachesWritePort;
            readonly passwordHasher: IPasswordHasherPort;
        }
    ) {}

    public async execute(body: { username?: string; password?: string; display_name?: string }) {
        const username = (body.username ?? '').trim().toLowerCase();
        if (username.length < 3) {
            throw new AdminValidationError('Le username du coach doit contenir au moins 3 caractères.');
        }
        const password = body.password ?? '';
        if (password.length < 6) {
            throw new AdminValidationError('Le mot de passe du coach doit contenir au moins 6 caractères.');
        }
        const displayName = (body.display_name ?? '').trim();
        if (displayName.length < 2) {
            throw new AdminValidationError('Le nom affiché du coach doit contenir au moins 2 caractères.');
        }

        const existing = await this.ports.coaches.findByUsername(username);
        if (existing) {
            throw new AdminValidationError('Ce username coach existe déjà.');
        }

        return this.ports.coaches.create({
            username,
            password: this.ports.passwordHasher.hash(password),
            displayName,
        });
    }
}
