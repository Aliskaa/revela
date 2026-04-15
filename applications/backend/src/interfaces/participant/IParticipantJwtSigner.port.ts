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

export const PARTICIPANT_JWT_SIGNER_PORT_SYMBOL = Symbol('PARTICIPANT_JWT_SIGNER_PORT_SYMBOL');

export interface IParticipantJwtSignerPort {
    signAccessToken(participantId: number): string;
}
