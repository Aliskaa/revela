// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import type {
    IParticipantsAdminReadPort,
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
    ParticipantFunctionLevel,
} from '@src/interfaces/participants/IParticipantsRepository.port';

import type { AdminParticipantDetail } from './get-admin-participant-detail.usecase';

const VALID_FUNCTION_LEVELS: ReadonlySet<ParticipantFunctionLevel> = new Set([
    'direction',
    'middle_management',
    'frontline_manager',
]);

const normalizeNullableTrimmed = (value: string | null): string | null => {
    if (value === null) return null;
    const t = value.trim();
    return t.length === 0 ? null : t;
};

/**
 * Body de mise à jour : seuls les champs de profil organisationnel sont éditables côté admin/coach.
 * `first_name`, `last_name`, `email`, `company_id` ne sont **pas** modifiables — ils sont définis à
 * la création (import CSV ou inscription) et ne doivent pas dériver pour préserver l'intégrité des
 * invitations et des liens existants.
 */
export type UpdateParticipantProfileBody = {
    organisation?: string | null;
    direction?: string | null;
    service?: string | null;
    function_level?: ParticipantFunctionLevel | null;
};

export class UpdateAdminParticipantUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsWriterPort &
                IParticipantsAdminReadPort;
        }
    ) {}

    public async execute(
        participantId: number,
        body: UpdateParticipantProfileBody,
        params: { coachId?: number }
    ): Promise<AdminParticipantDetail> {
        // 1. Vérifier le périmètre (un coach ne peut éditer que ses participants).
        const enriched = await this.ports.participants.findByIdEnriched(participantId, params);
        if (!enriched) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }

        const current = await this.ports.participants.findById(participantId);
        if (!current) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }

        // 2. Validation function_level.
        let nextFunctionLevel: ParticipantFunctionLevel | null | undefined = undefined;
        if (body.function_level !== undefined) {
            if (body.function_level === null) {
                nextFunctionLevel = null;
            } else if (VALID_FUNCTION_LEVELS.has(body.function_level)) {
                nextFunctionLevel = body.function_level;
            } else {
                throw new AdminValidationError('Niveau de fonction invalide.');
            }
        }

        // 3. Application du patch via la méthode domaine `updateProfile`.
        const profilePatch: Parameters<typeof current.updateProfile>[0] = {};
        if (body.organisation !== undefined) {
            profilePatch.organisation = normalizeNullableTrimmed(body.organisation);
        }
        if (body.direction !== undefined) {
            profilePatch.direction = normalizeNullableTrimmed(body.direction);
        }
        if (body.service !== undefined) {
            profilePatch.service = normalizeNullableTrimmed(body.service);
        }
        if (nextFunctionLevel !== undefined) {
            profilePatch.functionLevel = nextFunctionLevel;
        }

        if (Object.keys(profilePatch).length > 0) {
            const updated = current.updateProfile(profilePatch);
            const saved = await this.ports.participants.save(updated);
            if (!saved) {
                throw new AdminResourceNotFoundError('Participant introuvable.');
            }
        }

        // 4. Retour du détail enrichi rafraîchi.
        const refreshed = await this.ports.participants.findByIdEnriched(participantId, params);
        if (!refreshed) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }
        const campaigns = await this.ports.participants.listCampaignsForParticipant(participantId, params);
        return { participant: refreshed, campaigns };
    }
}
