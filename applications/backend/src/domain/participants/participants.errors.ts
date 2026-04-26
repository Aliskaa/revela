// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class ParticipantDomainError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ParticipantDomainError';
    }
}

export class ParticipantFirstNameRequiredError extends ParticipantDomainError {
    public constructor() {
        super('Le prénom du participant est requis.');
        this.name = 'ParticipantFirstNameRequiredError';
    }
}

export class ParticipantLastNameRequiredError extends ParticipantDomainError {
    public constructor() {
        super('Le nom du participant est requis.');
        this.name = 'ParticipantLastNameRequiredError';
    }
}

export class ParticipantEmailRequiredError extends ParticipantDomainError {
    public constructor() {
        super("L'email du participant est requis.");
        this.name = 'ParticipantEmailRequiredError';
    }
}

export class ParticipantPasswordHashRequiredError extends ParticipantDomainError {
    public constructor() {
        super('Le hash du mot de passe est requis.');
        this.name = 'ParticipantPasswordHashRequiredError';
    }
}
