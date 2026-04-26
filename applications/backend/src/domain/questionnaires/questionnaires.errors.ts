// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Questionnaire absent du catalogue (mappé en 404 par la présentation). */
export class QuestionnaireNotFoundError extends Error {
    public constructor() {
        super('');
        this.name = 'QuestionnaireNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
