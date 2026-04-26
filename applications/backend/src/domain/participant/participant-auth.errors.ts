// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class ParticipantInvalidCredentialsError extends Error {
    public constructor() {
        super('Invalid credentials');
        this.name = 'ParticipantInvalidCredentialsError';
    }
}

export class ParticipantPasswordNotSetError extends Error {
    public constructor() {
        super('Participant account has no password set yet');
        this.name = 'ParticipantPasswordNotSetError';
    }
}
