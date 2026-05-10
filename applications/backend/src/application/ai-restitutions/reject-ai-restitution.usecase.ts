// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type {
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

import { AiRestitutionNotFoundError } from './ai-restitution.errors';

/**
 * Rejette explicitement une restitution. Pas de validation §9 — le rejet est
 * une décision coach (« cette sortie ne convient pas, je préfère ne rien
 * diffuser »). Le participant n'aura jamais accès à un statut `rejected`.
 */
export class RejectAiRestitutionUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly restitutions: IAiRestitutionsRepositoryPort;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        coachId?: number;
    }): Promise<AiRestitutionRecord> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, {
            coachId: params.coachId,
        });
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }

        const existing = await this.ports.restitutions.findByParticipantCampaign(
            params.participantId,
            params.campaignId
        );
        if (!existing) {
            throw new AiRestitutionNotFoundError();
        }

        return this.ports.restitutions.update({
            id: existing.id,
            status: 'rejected',
            approvedAt: null,
            approvedByCoachId: null,
        });
    }
}
