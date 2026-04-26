// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Questionnaire inconnu du catalogue lors d’une soumission publique. */
export class ResponsesQuestionnaireNotFoundError extends Error {
    public constructor() {
        super('Questionnaire introuvable.');
        this.name = 'ResponsesQuestionnaireNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Corps ou données de soumission invalides (mappé en 400 avec `{ error: message }`). */
export class ResponsesValidationError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ResponsesValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Réponse inexistante pour lecture publique (corps 404 vide). */
export class ResponseRecordNotFoundError extends Error {
    public constructor() {
        super('');
        this.name = 'ResponseRecordNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** `questionnaireId` vide au moment de la création de l'entité — violation d'invariant. */
export class ResponseQuestionnaireIdRequiredError extends Error {
    public constructor() {
        super("L'identifiant du questionnaire est requis sur la réponse.");
        this.name = 'ResponseQuestionnaireIdRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
