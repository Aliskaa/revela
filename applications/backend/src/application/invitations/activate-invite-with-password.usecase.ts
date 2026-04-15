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

import {
    InviteActivationAlreadyCompletedError,
    InviteActivationWeakPasswordError,
    InviteResourceNotFoundError,
    InviteTokenRequestError,
} from '@src/domain/invitations/invitations.errors';
import type { IInviteActivationWritePort } from '@src/interfaces/invitations/IInviteActivationWrite.port';
import type { IParticipantJwtSignerPort } from '@src/interfaces/participant/IParticipantJwtSigner.port';
import type { IParticipantsIdentityReaderPort, IParticipantsCampaignStateReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IPasswordHasherPort } from '@aor/ports';
import type { InviteTokenValidationUseCase } from './invite-token-validation.usecase';

const MIN_PASSWORD_LENGTH = 8;

export class ActivateInviteWithPasswordResult {
    private constructor(public readonly accessToken: string) {
        Object.freeze(this);
    }

    public static create(accessToken: string): ActivateInviteWithPasswordResult {
        return new ActivateInviteWithPasswordResult(accessToken);
    }
}

export class ActivateInviteWithPasswordUseCase {
    public constructor(
        private readonly ports: {
            readonly tokenValidation: InviteTokenValidationUseCase;
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignStateReaderPort;
            readonly activationWrite: IInviteActivationWritePort;
            readonly jwtSigner: IParticipantJwtSignerPort;
            readonly passwordHasher: IPasswordHasherPort;
        }
    ) {}

    public async execute(tokenStr: string, passwordRaw: string): Promise<ActivateInviteWithPasswordResult> {
        const password = passwordRaw ?? '';
        if (password.length < MIN_PASSWORD_LENGTH) {
            throw new InviteActivationWeakPasswordError(
                `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
            );
        }

        const validated = await this.ports.tokenValidation.validateTokenString(tokenStr);
        if ('error' in validated) {
            throw new InviteTokenRequestError(validated.error);
        }
        const { invitation } = validated;
        if (invitation.campaignId !== null && invitation.campaignId !== undefined) {
            const participation = await this.ports.participants.getCampaignParticipantInviteState(
                invitation.campaignId,
                invitation.participantId
            );
            if (!participation?.joinedAt) {
                throw new InviteTokenRequestError(
                    'Vous devez d’abord confirmer votre participation à cette campagne.'
                );
            }
        }

        const participant = await this.ports.participants.findById(invitation.participantId);
        if (!participant) {
            throw new InviteResourceNotFoundError('Participant introuvable.');
        }
        if (participant.passwordHash) {
            throw new InviteActivationAlreadyCompletedError(
                'Ce compte est déjà activé. Connectez-vous avec votre e-mail et mot de passe.'
            );
        }

        const passwordHash = this.ports.passwordHasher.hash(password);
        await this.ports.activationWrite.setParticipantPasswordAndConsumeInvite({
            participantId: participant.id,
            invitationId: invitation.id,
            passwordHash,
        });

        return ActivateInviteWithPasswordResult.create(this.ports.jwtSigner.signAccessToken(participant.id));
    }
}
