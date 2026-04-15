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

export class ParticipantInvalidCredentialsError extends Error {
    public constructor() {
        super('Invalid credentials');
        this.name = 'ParticipantInvalidCredentialsError';
    }
}

export class ParticipantPasswordNotSetError extends Error {
    public constructor() {
        super('Participant account has no password set yet');
        this.name = 'ParticipantPasswordNotSetError';
    }
}
