// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';
import type { ElementBDraft } from '@aor/types';
import { upsertElementBDraftBodySchema } from '@aor/types';

import { ResponsesQuestionnaireNotFoundError, ResponsesValidationError } from '@src/domain/responses/responses.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IElementBDraftsRepositoryPort } from '@src/interfaces/responses/IElementBDraftsRepository.port';
import type { IResponsesSubmissionReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';

/**
 * Upsert d'un brouillon Élément Humain. Le frontend appelle cet endpoint à la
 * fin de chaque série pour sauvegarder les 54 réponses sur le serveur, en
 * filet de sécurité contre une déconnexion entre la série 0 et la série 1.
 *
 * Garde-fous métier :
 *  - questionnaire valide et user-facing (B/F/S),
 *  - participant activé et inscrit à la campagne (joinedAt),
 *  - campagne `active` (pas de sauvegarde si la campagne est draft/closed/archived),
 *  - questionnaire pas déjà soumis en `element_humain` (sinon 400 — la page de
 *    test redirige normalement vers le bandeau "déjà soumis", mais on durcit).
 */
export class UpsertParticipantElementBDraftUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
            readonly responses: IResponsesSubmissionReaderPort;
            readonly drafts: IElementBDraftsRepositoryPort;
        }
    ) {}

    public async execute(
        participantId: number,
        campaignId: number,
        qidParam: string,
        body: unknown
    ): Promise<ElementBDraft> {
        const qid = qidParam.toUpperCase();
        const questionnaire = getQuestionnaireEntry(qid);
        if (!questionnaire || !isQuestionnaireUserFacing(qid)) {
            throw new ResponsesQuestionnaireNotFoundError();
        }

        const parsed = upsertElementBDraftBodySchema.safeParse(body);
        if (!parsed.success) {
            throw new ResponsesValidationError('Corps JSON invalide.');
        }

        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new ResponsesValidationError('Participant introuvable.');
        }
        if (!participant.isActivated()) {
            throw new ResponsesValidationError('Compte non activé.');
        }

        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign || campaign.status !== 'active') {
            throw new ResponsesValidationError('La campagne n’est pas ouverte aux réponses pour le moment.');
        }

        const participation = await this.ports.participants.getCampaignParticipantInviteState(
            campaignId,
            participantId
        );
        if (!participation?.joinedAt) {
            throw new ResponsesValidationError(
                'Vous devez confirmer votre participation à la campagne avant de répondre.'
            );
        }

        const existing = await this.ports.responses.listForSubjectQuestionnaireMatrix(participantId, qid, campaignId);
        if (existing.some(r => r.submissionKind === 'element_humain')) {
            throw new ResponsesValidationError('Test scientifique deja soumis. Modification non autorisee.');
        }

        const draft = await this.ports.drafts.upsert({
            participantId,
            campaignId,
            questionnaireId: qid,
            ...(parsed.data.series0 !== undefined ? { series0: parsed.data.series0 } : {}),
            ...(parsed.data.series1 !== undefined ? { series1: parsed.data.series1 } : {}),
        });

        return {
            questionnaire_id: draft.questionnaireId,
            series0: draft.series0,
            series1: draft.series1,
            last_saved_at: draft.lastSavedAt.toISOString(),
        };
    }
}
