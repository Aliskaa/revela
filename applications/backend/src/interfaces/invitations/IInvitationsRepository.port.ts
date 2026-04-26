// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Invitation } from '@src/domain/invitations';

export const INVITATIONS_REPOSITORY_PORT_SYMBOL = Symbol('INVITATIONS_REPOSITORY_PORT_SYMBOL');

export interface IInvitationsReadPort {
    findByToken(token: string): Promise<Invitation | null>;
    findByParticipantId(participantId: number): Promise<Invitation[]>;
}

export interface IInvitationsWritePort {
    /**
     * Crée une invitation, **avec sémantique upsert idempotente** pour un même
     * `(participantId, campaignId, questionnaireId)` :
     *  - désactive au passage les invitations actives expirées pour ce triplet ;
     *  - si une invitation active non expirée existe déjà pour ce triplet, elle est retournée
     *    telle quelle (le token/expiresAt du draft est ignoré) ;
     *  - sinon, insère le draft et retourne l'entité persistée.
     */
    create(invitation: Invitation): Promise<Invitation>;
}

export interface IInvitationsRepositoryPort extends IInvitationsReadPort, IInvitationsWritePort {}
