// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import { Participant } from '@src/domain/participants';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
    ParticipantFunctionLevel,
} from '@src/interfaces/participants/IParticipantsRepository.port';

const VALID_FUNCTION_LEVELS = new Set<ParticipantFunctionLevel>([
    'direction',
    'middle_management',
    'frontline_manager',
]);

export type AddParticipantToCompanyInput = {
    first_name?: string;
    last_name?: string;
    email?: string;
    organisation?: string | null;
    direction?: string | null;
    service?: string | null;
    function_level?: string | null;
};

export type AddParticipantToCompanyResult = {
    participantId: number;
    /** `true` si le participant n'existait pas et vient d'être créé. `false` si on a réutilisé un existant. */
    created: boolean;
};

/**
 * Variante « company-level » de `AddParticipantToCampaignUseCase` (cf. P08 du suivi produit).
 * Utilisé par le formulaire d'ajout unitaire depuis la fiche entreprise.
 *
 * Différence clé avec la variante campagne : **pas d'invitation envoyée**, car aucun
 * questionnaire n'est associé à ce contexte. Le participant pourra être invité ensuite
 * depuis n'importe quelle campagne de l'entreprise.
 *
 * Contrôle d'accès : si `coachId` est fourni, on exige que ce coach ait au moins une
 * campagne attribuée dans cette entreprise (sinon il n'aurait pas dû arriver sur la fiche).
 *
 * Ownership : à la **création**, on persiste `createdByCoachId = coachId` (null en scope admin)
 * pour permettre la suppression unitaire ultérieure (cf. PDF AOR §coach delete). Si l'email
 * existe déjà et que le propriétaire est différent (admin ou autre coach), on **rejette** la
 * mutation au lieu de la modifier silencieusement — le coach n'a pas l'ownership.
 */
export class AddParticipantToCompanyUseCase {
    public constructor(
        private readonly ports: {
            readonly companies: ICompaniesReadPort;
            readonly campaigns: ICampaignsReadPort;
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort;
        }
    ) {}

    public async execute(
        companyId: number,
        input: AddParticipantToCompanyInput,
        access: { coachId?: number }
    ): Promise<AddParticipantToCompanyResult> {
        const company = await this.ports.companies.findById(companyId);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        if (access.coachId !== undefined) {
            const coachCampaigns = await this.ports.campaigns.listAll({ coachId: access.coachId });
            const hasCampaignInCompany = coachCampaigns.some(c => c.companyId === companyId);
            if (!hasCampaignInCompany) {
                throw new AdminResourceNotFoundError('Entreprise hors de votre périmètre.');
            }
        }

        const firstName = (input.first_name ?? '').trim();
        const lastName = (input.last_name ?? '').trim();
        const email = (input.email ?? '').trim().toLowerCase();
        if (!firstName || !lastName || !email) {
            throw new AdminValidationError('Prénom, nom et email sont requis.');
        }

        const organisation = (input.organisation ?? '')?.toString().trim() || null;
        const direction = (input.direction ?? '')?.toString().trim() || null;
        const service = (input.service ?? '')?.toString().trim() || null;
        const rawFunctionLevel = (input.function_level ?? '')?.toString().trim().toLowerCase();
        const functionLevel: ParticipantFunctionLevel | null =
            rawFunctionLevel && VALID_FUNCTION_LEVELS.has(rawFunctionLevel as ParticipantFunctionLevel)
                ? (rawFunctionLevel as ParticipantFunctionLevel)
                : null;

        let participant = await this.ports.participants.findByEmail(email);
        let created = false;
        if (!participant) {
            participant = await this.ports.participants.create(
                Participant.create({
                    firstName,
                    lastName,
                    email,
                    companyId: company.id,
                    createdByCoachId: access.coachId ?? null,
                })
            );
            created = true;
        } else {
            // Participant existant : un coach ne peut le réassocier ou modifier son profil que
            // s'il en est lui-même propriétaire (créé via son propre ajout unitaire). Sinon,
            // on rejette pour éviter une mutation silencieuse d'un participant créé par admin
            // ou un autre coach (cf. PDF AOR §coach delete).
            const isCoachScope = access.coachId !== undefined;
            const ownsParticipant = isCoachScope && participant.createdByCoachId === access.coachId;
            if (isCoachScope && !ownsParticipant) {
                throw new AdminValidationError('Ce participant existe déjà et ne peut pas être modifié.');
            }

            if (participant.companyId !== company.id) {
                const reassigned = participant.setCompanyId(company.id);
                const saved = await this.ports.participants.save(reassigned);
                if (saved) {
                    participant = saved;
                }
            }
        }

        if (organisation || direction || service || functionLevel) {
            const withProfile = participant.updateProfile({
                ...(organisation !== null && { organisation }),
                ...(direction !== null && { direction }),
                ...(service !== null && { service }),
                ...(functionLevel !== null && { functionLevel }),
            });
            const saved = await this.ports.participants.save(withProfile);
            if (saved) {
                participant = saved;
            }
        }

        return { participantId: participant.id, created };
    }
}
