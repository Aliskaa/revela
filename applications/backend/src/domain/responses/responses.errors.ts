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
