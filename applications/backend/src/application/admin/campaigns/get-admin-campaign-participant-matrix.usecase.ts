// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantQuestionnaireMatrix } from '@aor/types';

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

/**
 * Matrice des réponses d'un participant **dans le contexte d'une campagne** (axe participation,
 * ADR-010 R3). Le `qid` n'est pas lu en query : il est **dérivé de la campagne**
 * (`campaign.questionnaireId`), une campagne ne portant qu'un seul questionnaire
 * ([campaign.entity.ts](../../../domain/campaigns/campaign.entity.ts)). C'est le miroir admin de
 * `GetParticipantSessionQuestionnaireMatrixUseCase` (qui dérive le `qid` de l'assignation côté
 * participant). Le scope coach est appliqué deux fois : ici via `findById({ coachId })` au niveau
 * campagne, et dans `getMatrix` au niveau participant.
 */
export class GetAdminCampaignParticipantMatrixUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly getMatrix: GetParticipantQuestionnaireMatrixUseCase;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        coachId?: number;
    }): Promise<ParticipantQuestionnaireMatrix> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, { coachId: params.coachId });
        if (!campaign) {
            // 404 (vs 403) pour ne pas leak l'existence d'une campagne hors périmètre coach (G5 RGPD).
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }

        // `qid` dérivé de la campagne. Un `questionnaireId` absent/invalide est rejeté en aval par
        // `getMatrix` (AdminInvalidQuestionnaireError → 400) : pas de double validation ici.
        const qid = (campaign.questionnaireId ?? '').toUpperCase();

        return this.ports.getMatrix.execute({
            participantId: params.participantId,
            qid,
            campaignId: params.campaignId,
            coachId: params.coachId,
            // Vue résultats admin/coach : colonnes = feedbacks reçus, jamais anonymisés (super-admin inclus).
            peerColumnPerspective: 'received',
            anonymizeReceivedPeerLabels: false,
        });
    }
}
