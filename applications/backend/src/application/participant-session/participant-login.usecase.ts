// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IPasswordVerifierPort } from '@aor/ports';
import {
    ParticipantInvalidCredentialsError,
    ParticipantPasswordNotSetError,
} from '@src/domain/participant-session/participant-auth.errors';
import type { IParticipantJwtSignerPort } from '@src/interfaces/participant-session/IParticipantJwtSigner.port';
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
        if (!participant.isActivated()) {
            throw new ParticipantPasswordNotSetError();
        }
        if (!participant.verifyPassword(password, this.ports.passwordVerifier)) {
            throw new ParticipantInvalidCredentialsError();
        }
        return ParticipantLoginResult.create(this.ports.jwtSigner.signAccessToken(participant.id));
    }
}
