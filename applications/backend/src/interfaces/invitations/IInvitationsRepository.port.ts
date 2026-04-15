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

export const INVITATIONS_REPOSITORY_PORT_SYMBOL = Symbol('INVITATIONS_REPOSITORY_PORT_SYMBOL');

export type InvitationRecord = {
    id: number;
    token: string;
    participantId: number;
    campaignId: number | null;
    questionnaireId: string;
    createdAt: Date | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    isActive: boolean;
};

export type CreateInvitationCommand = {
    token: string;
    participantId: number;
    campaignId?: number;
    questionnaireId: string;
    expiresAt?: Date;
};

export interface IInvitationsReadPort {
    findByToken(token: string): Promise<InvitationRecord | null>;
    findByParticipantId(participantId: number): Promise<InvitationRecord[]>;
}

export interface IInvitationsWritePort {
    create(command: CreateInvitationCommand): Promise<InvitationRecord>;
    markUsed(id: number): Promise<void>;
}

export interface IInvitationsRepositoryPort extends IInvitationsReadPort, IInvitationsWritePort {}
