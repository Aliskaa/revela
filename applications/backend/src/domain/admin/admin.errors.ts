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

/** Erreurs métier du périmètre admin (mappées en HTTP par la couche présentation). */
export class AdminInvalidCredentialsError extends Error {
    public constructor() {
        super('Identifiants incorrects.');
        this.name = 'AdminInvalidCredentialsError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminConfirmationRequiredError extends Error {
    public constructor() {
        super('Confirmation requise. Envoyez {"confirm": true} pour supprimer définitivement.');
        this.name = 'AdminConfirmationRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminResourceNotFoundError extends Error {
    /** Message vide : corps de réponse HTTP 404 vide `{}` (comportement historique). */
    public constructor(message = '') {
        super(message);
        this.name = 'AdminResourceNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminInvalidQuestionnaireError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'AdminInvalidQuestionnaireError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminCsvFileRequiredError extends Error {
    public constructor() {
        super("Fichier CSV requis (champ 'file').");
        this.name = 'AdminCsvFileRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminCompanyIdRequiredError extends Error {
    public constructor() {
        super('Paramètre company_id requis.');
        this.name = 'AdminCompanyIdRequiredError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AdminValidationError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'AdminValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
