// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { AiRestitutionParticipantView } from '@aor/types';

import type { IAiRestitutionsRepositoryPort } from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';

/**
 * Lecture participant de la restitution. Renvoie `null` tant que le coach
 * n'a pas approuvé (cf. décision Laurent 2026-05-10 : diffusion contrôlée).
 *
 * Le payload est minimaliste : aucun rawOutput, aucun rapport de validation,
 * aucune métadonnée d'audit. Le contrôleur convertit `null` en HTTP 404.
 */
export class GetOwnParticipantAiRestitutionUseCase {
    public constructor(
        private readonly ports: {
            readonly restitutions: IAiRestitutionsRepositoryPort;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
    }): Promise<AiRestitutionParticipantView | null> {
        const record = await this.ports.restitutions.findByParticipantCampaign(params.participantId, params.campaignId);
        if (!record || record.status !== 'approved' || record.approvedAt === null) {
            return null;
        }
        const text = record.editedOutput ?? record.rawOutput;
        return {
            campaign_id: record.campaignId,
            text,
            approved_at: record.approvedAt.toISOString(),
        };
    }
}
