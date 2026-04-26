// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { InviteTokenRequestError } from '@src/domain/invitations/invitations.errors';
import type { IParticipantsCampaignParticipationWriterPort } from '@src/interfaces/participants/IParticipantsRepository.port';

import type { InviteTokenValidationUseCase } from './invite-token-validation.usecase';

/** Enregistre la confirmation explicite du participant pour une campagne liée au jeton. */
export class ConfirmInviteParticipationUseCase {
    public constructor(
        private readonly ports: {
            readonly tokenValidation: InviteTokenValidationUseCase;
            readonly participants: IParticipantsCampaignParticipationWriterPort;
        }
    ) {}

    public async execute(token: string): Promise<{ invitation_confirmed: boolean }> {
        const validated = await this.ports.tokenValidation.validateTokenString(token);
        if ('error' in validated) {
            throw new InviteTokenRequestError(validated.error);
        }
        const { invitation } = validated;
        if (invitation.campaignId === null || invitation.campaignId === undefined) {
            return { invitation_confirmed: true };
        }
        await this.ports.participants.confirmCampaignParticipantParticipation(
            invitation.campaignId,
            invitation.participantId
        );
        return { invitation_confirmed: true };
    }
}
