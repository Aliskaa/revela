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
    ParticipantInvalidCredentialsError,
    ParticipantPasswordNotSetError,
} from '@src/domain/participant/participant-auth.errors';
import { hashPassword, verifyPassword } from '@aor/adapters';
import type { IParticipantJwtSignerPort } from '@src/interfaces/participant/IParticipantJwtSigner.port';
import type { IParticipantsRepositoryPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IPasswordVerifierPort } from '@aor/ports';
import { expect, test } from 'vitest';

import { ParticipantLoginUseCase } from './participant-login.usecase';

const hashed = hashPassword('correct-horse');

const stubParticipants = (record: Awaited<ReturnType<IParticipantsRepositoryPort['findByEmail']>>) =>
    ({
        findByEmail: async () => record,
    }) as unknown as IParticipantsRepositoryPort;

const stubSigner: IParticipantJwtSignerPort = {
    signAccessToken: (id: number) => `token-for-${id}`,
};

const stubVerifier: IPasswordVerifierPort = {
    verify: (plainPassword: string, stored: string) => verifyPassword(plainPassword, stored),
    verifyOrPlaintextLegacy: () => false,
};

test('participant login returns access token when credentials match', async () => {
    const useCase = new ParticipantLoginUseCase({
        participants: stubParticipants({
            id: 42,
            companyId: null,
            firstName: 'A',
            lastName: 'B',
            email: 'a@example.com',
            organisation: null,
            direction: null,
            service: null,
            functionLevel: null,
            passwordHash: hashed,
            createdAt: new Date(),
        }),
        jwtSigner: stubSigner,
        passwordVerifier: stubVerifier,
    });

    const result = await useCase.execute('a@example.com', 'correct-horse');
    expect(result.accessToken).toBe('token-for-42');
});

test('participant login rejects unknown email', async () => {
    const useCase = new ParticipantLoginUseCase({
        participants: stubParticipants(null),
        jwtSigner: stubSigner,
        passwordVerifier: stubVerifier,
    });

    await expect(useCase.execute('x@example.com', 'x')).rejects.toBeInstanceOf(ParticipantInvalidCredentialsError);
});

test('participant login rejects when password hash not set', async () => {
    const useCase = new ParticipantLoginUseCase({
        participants: stubParticipants({
            id: 1,
            companyId: null,
            firstName: 'A',
            lastName: 'B',
            email: 'a@example.com',
            organisation: null,
            direction: null,
            service: null,
            functionLevel: null,
            passwordHash: null,
            createdAt: new Date(),
        }),
        jwtSigner: stubSigner,
        passwordVerifier: stubVerifier,
    });

    await expect(useCase.execute('a@example.com', 'any')).rejects.toBeInstanceOf(ParticipantPasswordNotSetError);
});

test('participant login rejects wrong password', async () => {
    const useCase = new ParticipantLoginUseCase({
        participants: stubParticipants({
            id: 1,
            companyId: null,
            firstName: 'A',
            lastName: 'B',
            email: 'a@example.com',
            organisation: null,
            direction: null,
            service: null,
            functionLevel: null,
            passwordHash: hashed,
            createdAt: new Date(),
        }),
        jwtSigner: stubSigner,
        passwordVerifier: stubVerifier,
    });

    await expect(useCase.execute('a@example.com', 'wrong')).rejects.toBeInstanceOf(ParticipantInvalidCredentialsError);
});
