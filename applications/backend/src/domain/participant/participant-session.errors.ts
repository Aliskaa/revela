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

/** Participant absent en base alors qu’un JWT valide est présent (compte supprimé, etc.). */
export class ParticipantAccountNotFoundError extends Error {
    public constructor() {
        super('Compte participant introuvable.');
        this.name = 'ParticipantAccountNotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Le `qid` demandé ne figure pas parmi les questionnaires liés aux jetons du participant. */
export class ParticipantQuestionnaireNotAllowedError extends Error {
    public constructor(message?: string) {
        super(message ?? "Ce questionnaire n'est pas lié à vos invitations.");
        this.name = 'ParticipantQuestionnaireNotAllowedError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Aucun questionnaire dérivé des jetons d’invitation (jeton consommé ou dernier jeton créé). */
export class ParticipantAssignedQuestionnaireMissingError extends Error {
    public constructor() {
        super('Aucun questionnaire associé à votre compte. Contactez votre administrateur.');
        this.name = 'ParticipantAssignedQuestionnaireMissingError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
