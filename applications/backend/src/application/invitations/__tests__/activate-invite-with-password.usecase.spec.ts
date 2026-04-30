// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { hashPassword, verifyPassword } from '@aor/adapters';
import type { IPasswordHasherPort } from '@aor/ports';
import { Invitation } from '@src/domain/invitations';
import { Participant } from '@src/domain/participants';
import {
    InviteActivationAlreadyCompletedError,
    InviteActivationWeakPasswordError,
    InviteTokenRequestError,
} from '@src/domain/invitations/invitations.errors';
import type { IInvitationsRepositoryPort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IInviteActivationWritePort,
    InviteActivationWriteParams,
} from '@src/interfaces/invitations/IInviteActivationWrite.port';
import type { IParticipantJwtSignerPort } from '@src/interfaces/participant-session/IParticipantJwtSigner.port';
import type { IParticipantsRepositoryPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import { expect, test } from 'vitest';

import { ActivateInviteWithPasswordUseCase } from '../activate-invite-with-password.usecase';
import { InviteTokenValidationUseCase } from '../invite-token-validation.usecase';

const invitation: Invitation = Invitation.hydrate({
    id: 9,
    token: 'tok',
    participantId: 3,
    campaignId: null,
    questionnaireId: 'A',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    usedAt: null,
    isActive: true,
});

const passwordHasher: IPasswordHasherPort = {
    hash: (plainPassword: string) => hashPassword(plainPassword),
};

function invitationsStub(findByToken: IInvitationsRepositoryPort['findByToken']): IInvitationsRepositoryPort {
    return {
        findByToken,
        create: async () => invitation,
        findByParticipantId: async () => [],
    };
}

test('activate invite sets password, consumes invite, returns jwt', async () => {
    const invitations = invitationsStub(async (t: string) => (t === 'tok' ? invitation : null));
    const tokenValidation = new InviteTokenValidationUseCase({ invitations });
    const participants = {
        findById: async (id: number) =>
            id === 3
                ? Participant.hydrate({
                      id: 3,
                      companyId: null,
                      firstName: 'X',
                      lastName: 'Y',
                      email: 'x@y.z',
                      organisation: null,
                      direction: null,
                      service: null,
                      functionLevel: null,
                      passwordHash: null,
                      createdAt: new Date(),
                  })
                : null,
    } as unknown as IParticipantsRepositoryPort;

    const written = { params: null as InviteActivationWriteParams | null };
    const activationWrite: IInviteActivationWritePort = {
        setParticipantPasswordAndConsumeInvite: async params => {
            written.params = params;
        },
    };
    const jwtSigner: IParticipantJwtSignerPort = {
        signAccessToken: id => `jwt-${id}`,
    };

    const useCase = new ActivateInviteWithPasswordUseCase({
        tokenValidation,
        participants,
        activationWrite,
        jwtSigner,
        passwordHasher,
    });

    const result = await useCase.execute('tok', 'longpassword');
    expect(result.accessToken).toBe('jwt-3');
    expect(written.params?.participantId).toBe(3);
    expect(written.params?.invitationId).toBe(9);
    expect(written.params?.passwordHash).toBeDefined();
    if (!written.params?.passwordHash) {
        throw new Error('expected password hash');
    }
    expect(verifyPassword('longpassword', written.params.passwordHash)).toBe(true);
});

test('activate invite rejects short password', async () => {
    const useCase = new ActivateInviteWithPasswordUseCase({
        tokenValidation: new InviteTokenValidationUseCase({ invitations: invitationsStub(async () => null) }),
        participants: {} as IParticipantsRepositoryPort,
        activationWrite: { setParticipantPasswordAndConsumeInvite: async () => {} },
        jwtSigner: { signAccessToken: () => '' },
        passwordHasher,
    });

    await expect(useCase.execute('tok', 'short')).rejects.toBeInstanceOf(InviteActivationWeakPasswordError);
});

test('activate invite rejects when participant already has password', async () => {
    const invitations = invitationsStub(async () => invitation);
    const tokenValidation = new InviteTokenValidationUseCase({ invitations });
    const participants = {
        findById: async () =>
            Participant.hydrate({
                id: 3,
                companyId: null,
                firstName: 'X',
                lastName: 'Y',
                email: 'x@y.z',
                organisation: null,
                direction: null,
                service: null,
                functionLevel: null,
                passwordHash: hashPassword('existing'),
                createdAt: new Date(),
            }),
    } as unknown as IParticipantsRepositoryPort;

    const useCase = new ActivateInviteWithPasswordUseCase({
        tokenValidation,
        participants,
        activationWrite: { setParticipantPasswordAndConsumeInvite: async () => {} },
        jwtSigner: { signAccessToken: () => '' },
        passwordHasher,
    });

    await expect(useCase.execute('tok', 'longenough')).rejects.toBeInstanceOf(InviteActivationAlreadyCompletedError);
});

test('activate invite propagates invalid token', async () => {
    const invitations = invitationsStub(async () => null);
    const tokenValidation = new InviteTokenValidationUseCase({ invitations });
    const useCase = new ActivateInviteWithPasswordUseCase({
        tokenValidation,
        participants: { findById: async () => null } as unknown as IParticipantsRepositoryPort,
        activationWrite: { setParticipantPasswordAndConsumeInvite: async () => {} },
        jwtSigner: { signAccessToken: () => '' },
        passwordHasher,
    });

    await expect(useCase.execute('bad', 'longenough')).rejects.toBeInstanceOf(InviteTokenRequestError);
});
