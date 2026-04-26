// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class CoachDomainError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'CoachDomainError';
    }
}

export class CoachUsernameTooShortError extends CoachDomainError {
    public constructor() {
        super('Le username du coach doit contenir au moins 3 caractères.');
        this.name = 'CoachUsernameTooShortError';
    }
}

export class CoachDisplayNameTooShortError extends CoachDomainError {
    public constructor() {
        super('Le nom affiché du coach doit contenir au moins 2 caractères.');
        this.name = 'CoachDisplayNameTooShortError';
    }
}

export class CoachPasswordHashRequiredError extends CoachDomainError {
    public constructor() {
        super('Le hash du mot de passe du coach est requis.');
        this.name = 'CoachPasswordHashRequiredError';
    }
}
