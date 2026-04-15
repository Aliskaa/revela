/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { AdminConfirmationRequiredError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IParticipantsWriterPort } from '@src/interfaces/participants/IParticipantsRepository.port';

export class EraseParticipantRgpdUseCase {
    public constructor(private readonly ports: { readonly participants: IParticipantsWriterPort }) {}

    public async execute(
        participantId: number,
        confirm: boolean | undefined
    ): Promise<{
        message: string;
        deleted_participant_id: number;
        responses_removed: number;
        invite_tokens_removed: number;
    }> {
        if (confirm !== true) {
            throw new AdminConfirmationRequiredError();
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
