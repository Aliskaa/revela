// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminConfirmationRequiredError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type {
    IParticipantsAdminReadPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class EraseParticipantRgpdUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsWriterPort & IParticipantsAdminReadPort;
        }
    ) {}

    /**
     * Effacement RGPD d'un participant et de toutes ses données rattachées.
     *
     * Filtrage scope=coach (G4 RGPD + PDF AOR §coach delete) : si `coachId` est fourni
     * (cas d'un coach connecté), on exige que :
     *  1. Le coach ait accès au participant (via `findByIdEnriched`, qui vérifie qu'il
     *     possède au moins une campagne dans l'entreprise du participant).
     *  2. Le coach soit le **propriétaire** du participant (`createdByCoachId === coachId`),
     *     i.e. il l'a ajouté lui-même unitairement. Un participant créé par admin (CSV) ou
     *     par un autre coach ne peut pas être supprimé par ce coach.
     *
     * Sortie hors-périmètre → `AdminResourceNotFoundError` (404), aligné sur les autres
     * endpoints détail (cf. ADR-008 et docs/avancement-2026-04-28.md §5). Le 404 (plutôt
     * qu'un 403) évite de leak l'existence du participant.
     */
    public async execute(
        participantId: number,
        confirm: boolean | undefined,
        params: { coachId?: number } = {}
    ): Promise<{
        message: string;
        deleted_participant_id: number;
        responses_removed: number;
        invite_tokens_removed: number;
    }> {
        if (confirm !== true) {
            throw new AdminConfirmationRequiredError();
        }

        if (params.coachId !== undefined) {
            const allowed = await this.ports.participants.findByIdEnriched(participantId, {
                coachId: params.coachId,
            });
            if (!allowed) {
                throw new AdminResourceNotFoundError();
            }
            if (allowed.createdByCoachId !== params.coachId) {
                throw new AdminResourceNotFoundError();
            }
        }

        const summary = await this.ports.participants.eraseParticipantRgpd(participantId);
        if (!summary) {
            throw new AdminResourceNotFoundError();
        }
        return {
            message: 'Données du participant supprimées définitivement.',
            deleted_participant_id: participantId,
            responses_removed: summary.responsesRemoved,
            invite_tokens_removed: summary.inviteTokensRemoved,
        };
    }
}
