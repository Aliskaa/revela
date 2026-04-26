// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class CompanyDomainError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'CompanyDomainError';
    }
}

export class CompanyNameRequiredError extends CompanyDomainError {
    public constructor() {
        super("Le nom de l'entreprise est requis.");
        this.name = 'CompanyNameRequiredError';
    }
}
