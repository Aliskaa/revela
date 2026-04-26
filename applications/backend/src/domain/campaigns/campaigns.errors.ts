// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export class CampaignDomainError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'CampaignDomainError';
    }
}

export class CampaignNameTooShortError extends CampaignDomainError {
    public constructor() {
        super('Le nom de la campagne doit contenir au moins 3 caractères.');
        this.name = 'CampaignNameTooShortError';
    }
}

export class CampaignQuestionnaireRequiredError extends CampaignDomainError {
    public constructor() {
        super('Le questionnaire de la campagne est requis.');
        this.name = 'CampaignQuestionnaireRequiredError';
    }
}

export class CampaignScheduleInvalidError extends CampaignDomainError {
    public constructor() {
        super('ends_at doit être postérieur à starts_at.');
        this.name = 'CampaignScheduleInvalidError';
    }
}

export class CampaignInvalidStatusError extends CampaignDomainError {
    public constructor(raw: string) {
        super(`Statut de campagne invalide : « ${raw} ».`);
        this.name = 'CampaignInvalidStatusError';
    }
}
