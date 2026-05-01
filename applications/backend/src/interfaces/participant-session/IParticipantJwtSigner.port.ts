// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const PARTICIPANT_JWT_SIGNER_PORT_SYMBOL = Symbol('PARTICIPANT_JWT_SIGNER_PORT_SYMBOL');

export interface IParticipantJwtSignerPort {
    signAccessToken(participantId: number): string;
}
