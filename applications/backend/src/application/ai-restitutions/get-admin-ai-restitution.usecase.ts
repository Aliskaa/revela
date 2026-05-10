// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type {
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

/**
 * Lecture admin/coach de la restitution. `null` si aucune restitution n'a
 * encore été générée. Inclut tout le rapport d'audit (intermediateJson,
 * rawOutput, validationReport) — réservé au coach et à l'admin.
 */
export class GetAdminAiRestitutionUseCase {
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
    }): Promise<AiRestitutionRecord | null> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, {
            coachId: params.coachId,
        });
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        return this.ports.restitutions.findByParticipantCampaign(params.participantId, params.campaignId);
    }
}
