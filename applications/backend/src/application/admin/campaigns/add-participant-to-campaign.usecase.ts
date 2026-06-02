// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { randomBytes } from 'node:crypto';

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import { Invitation } from '@src/domain/invitations';
import { Participant } from '@src/domain/participants';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IParticipantsCampaignParticipationWriterPort,
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
    ParticipantFunctionLevel,
} from '@src/interfaces/participants/IParticipantsRepository.port';

const VALID_FUNCTION_LEVELS = new Set<ParticipantFunctionLevel>([
    'direction',
    'middle_management',
    'frontline_manager',
]);

export type AddParticipantToCampaignInput = {
    first_name?: string;
    last_name?: string;
    email?: string;
    organisation?: string | null;
    direction?: string | null;
    service?: string | null;
    function_level?: string | null;
};

export type AddParticipantToCampaignResult = {
    participantId: number;
    /** `true` si le participant n'existait pas et vient d'être créé. `false` si on a réutilisé un existant. */
    created: boolean;
    /** Toujours `true` une fois l'opération réussie : on garantit l'invitation. */
    invited: boolean;
};

/**
 * Variante unitaire de `ImportParticipantsToCampaignUseCase` (cf. P08 du suivi produit) :
 * permet à l'admin **et** au coach d'ajouter un participant à une campagne via un formulaire
 * (et non via un import CSV). Le restriction scope=coach est appliquée au niveau du
 * controller (`ensureCampaignAccess`).
 *
 * Comportement aligné sur l'import CSV existant :
 * - Si l'email existe déjà ET que le coach n'en est pas propriétaire (admin ou autre coach) :
 *   on **rejette** la mutation (ownership protégé pour la suppression unitaire).
 * - Si l'email existe déjà ET que l'admin agit OU que le coach en est propriétaire :
 *   on réassigne à l'entreprise de la campagne et on rafraîchit le profil.
 * - Si l'email est nouveau : création (avec `createdByCoachId = coachId`), profil rempli,
 *   association à la campagne, invitation émise.
 */
export class AddParticipantToCampaignUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly companies: ICompaniesReadPort;
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsWriterPort &
                IParticipantsCampaignParticipationWriterPort;
            readonly invitations: IInvitationsWritePort;
        }
    ) {}

    public async execute(
        campaignId: number,
        input: AddParticipantToCampaignInput,
        access: { coachId?: number } = {}
    ): Promise<AddParticipantToCampaignResult> {
        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        if (!campaign.questionnaireId) {
            throw new AdminValidationError("La campagne n'a pas de questionnaire associé.");
        }

        const company = await this.ports.companies.findById(campaign.companyId);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise de campagne introuvable.');
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

        await this.ports.invitations.create(
            Invitation.create({
                token: randomBytes(32).toString('base64url'),
                participantId: participant.id,
                campaignId: campaign.id,
                questionnaireId: campaign.questionnaireId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            })
        );
        await this.ports.participants.ensureCampaignParticipantInvited(campaign.id, participant.id);

        return { participantId: participant.id, created, invited: true };
    }
}
