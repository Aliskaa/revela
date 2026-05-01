// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const INVITE_ACTIVATION_WRITE_PORT_SYMBOL = Symbol('INVITE_ACTIVATION_WRITE_PORT_SYMBOL');

export type InviteActivationWriteParams = {
    participantId: number;
    invitationId: number;
    passwordHash: string;
};

export interface IInviteActivationWritePort {
    setParticipantPasswordAndConsumeInvite(params: InviteActivationWriteParams): Promise<void>;
}
