// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Jeton invalide, désactivé, expiré ou déjà utilisé → 400 `{ error }`. */
export class InviteTokenRequestError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'InviteTokenRequestError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Participant ou questionnaire introuvable dans le flux invitation → 404 `{ error }`. */
export class InviteResourceNotFoundError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'InviteResourceNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Corps JSON ou séries de réponses invalides → 400 `{ error }`. */
export class InviteSubmissionValidationError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'InviteSubmissionValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Mot de passe d’activation trop faible → 400 `{ error }`. */
export class InviteActivationWeakPasswordError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'InviteActivationWeakPasswordError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Le participant a déjà un mot de passe : connexion classique → 409 `{ error }`. */
export class InviteActivationAlreadyCompletedError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'InviteActivationAlreadyCompletedError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Jeton d'invitation vide au moment de la création de l'entité — violation d'invariant. */
export class InvitationTokenRequiredError extends Error {
    public constructor() {
        super("Le jeton de l'invitation est requis.");
        this.name = 'InvitationTokenRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** `questionnaireId` vide au moment de la création de l'entité — violation d'invariant. */
export class InvitationQuestionnaireIdRequiredError extends Error {
    public constructor() {
        super("L'identifiant du questionnaire est requis.");
        this.name = 'InvitationQuestionnaireIdRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
