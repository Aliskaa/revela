// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';
import type { ElementBDraft } from '@aor/types';

import { ResponsesQuestionnaireNotFoundError, ResponsesValidationError } from '@src/domain/responses/responses.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IElementBDraftsRepositoryPort } from '@src/interfaces/responses/IElementBDraftsRepository.port';

/**
 * Lit le brouillon Élément Humain (B/F/S) du participant pour une campagne donnée.
 * Retourne `null` quand aucun brouillon n'existe (cas le plus fréquent : première
 * arrivée sur la page, ou brouillon supprimé suite à la soumission finale).
 */
export class GetParticipantElementBDraftUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
            readonly drafts: IElementBDraftsRepositoryPort;
        }
    ) {}

    public async execute(participantId: number, campaignId: number, qidParam: string): Promise<ElementBDraft | null> {
        const qid = qidParam.toUpperCase();
        const questionnaire = getQuestionnaireEntry(qid);
        if (!questionnaire || !isQuestionnaireUserFacing(qid)) {
            throw new ResponsesQuestionnaireNotFoundError();
        }

        const participant = await this.ports.participants.findById(participantId);
        if (!participant || !participant.isActivated()) {
            throw new ResponsesValidationError('Participant introuvable ou compte non activé.');
        }

        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign) {
            throw new ResponsesValidationError('Campagne introuvable.');
        }

        const participation = await this.ports.participants.getCampaignParticipantInviteState(
            campaignId,
            participantId
        );
        if (!participation?.joinedAt) {
            throw new ResponsesValidationError(
                'Vous devez confirmer votre participation à la campagne avant d’accéder au brouillon.'
            );
        }

        const draft = await this.ports.drafts.findByKey(participantId, campaignId, qid);
        if (!draft) return null;
        return {
            questionnaire_id: draft.questionnaireId,
            series0: draft.series0,
            series1: draft.series1,
            last_saved_at: draft.lastSavedAt.toISOString(),
        };
    }
}
