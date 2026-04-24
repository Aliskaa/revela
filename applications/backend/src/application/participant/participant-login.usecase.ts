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

import type { IPasswordVerifierPort } from '@aor/ports';
import {
    ParticipantInvalidCredentialsError,
    ParticipantPasswordNotSetError,
} from '@src/domain/participant/participant-auth.errors';
import type { IParticipantJwtSignerPort } from '@src/interfaces/participant/IParticipantJwtSigner.port';
import type { IParticipantsIdentityReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';

export class ParticipantLoginResult {
    private constructor(public readonly accessToken: string) {
        Object.freeze(this);
    }

    public static create(accessToken: string): ParticipantLoginResult {
        return new ParticipantLoginResult(accessToken);
    }
}

export class ParticipantLoginUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort;
            readonly jwtSigner: IParticipantJwtSignerPort;
            readonly passwordVerifier: IPasswordVerifierPort;
        }
    ) {}

    public async execute(emailRaw: string, password: string): Promise<ParticipantLoginResult> {
        const email = emailRaw.trim().toLowerCase();
        if (!email || !password) {
            throw new ParticipantInvalidCredentialsError();
        }
        const participant = await this.ports.participants.findByEmail(email);
        if (!participant) {
            throw new ParticipantInvalidCredentialsError();
        }
        if (!participant.passwordHash) {
            throw new ParticipantPasswordNotSetError();
        }
        if (!this.ports.passwordVerifier.verify(password, participant.passwordHash)) {
            throw new ParticipantInvalidCredentialsError();
        }
        return ParticipantLoginResult.create(this.ports.jwtSigner.signAccessToken(participant.id));
    }
}
