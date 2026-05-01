// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { InvitationQuestionnaireIdRequiredError, InvitationTokenRequiredError } from './invitations.errors';

/**
 * Statut calculé de l'invitation.
 *
 * Priorité d'évaluation (du plus terminal au moins terminal) :
 * `used` → `deactivated` → `expired` → `active`.
 */
export type InvitationStatus = 'active' | 'deactivated' | 'expired' | 'used';

export type InvitationUseCheck =
    | { usable: true }
    | { usable: false; status: 'deactivated' | 'expired' | 'used'; reason: string };

/**
 * Entité Invitation avec machine à états.
 *
 * Champs stables (identifiants métier) : `token`, `participantId`, `campaignId`,
 * `questionnaireId`. Ils ne changent jamais une fois l'invitation créée.
 *
 * Champs mutables (portés par des transitions) : `expiresAt` (via `extend`),
 * `usedAt` (via `markUsed`), `isActive` (via `deactivate`/`activate`).
 */
export class Invitation {
    private constructor(
        public readonly id: number,
        public readonly token: string,
        public readonly participantId: number,
        public readonly campaignId: number | null,
        public readonly questionnaireId: string,
        public readonly createdAt: Date | null,
        public readonly expiresAt: Date | null,
        public readonly usedAt: Date | null,
        public readonly isActive: boolean
    ) {
        Object.freeze(this);
    }

    public static create(props: {
        token: string;
        participantId: number;
        campaignId?: number | null;
        questionnaireId: string;
        expiresAt?: Date | null;
    }): Invitation {
        if (props.token.length === 0) {
            throw new InvitationTokenRequiredError();
        }
        const qid = props.questionnaireId.trim().toUpperCase();
        if (qid.length === 0) {
            throw new InvitationQuestionnaireIdRequiredError();
        }
        return new Invitation(
            0,
            props.token,
            props.participantId,
            props.campaignId ?? null,
            qid,
            null,
            props.expiresAt ?? null,
            null,
            true
        );
    }

    public static hydrate(props: {
        id: number;
        token: string;
        participantId: number;
        campaignId: number | null;
        questionnaireId: string;
        createdAt: Date | null;
        expiresAt: Date | null;
        usedAt: Date | null;
        isActive: boolean;
    }): Invitation {
        return new Invitation(
            props.id,
            props.token,
            props.participantId,
            props.campaignId,
            props.questionnaireId,
            props.createdAt,
            props.expiresAt,
            props.usedAt,
            props.isActive
        );
    }

    /**
     * Priorité de statut : `used` > `deactivated` > `expired` > `active`. Les états terminaux
     * (used) prennent le pas sur les états intermédiaires, même si techniquement l'invitation
     * est aussi expirée ou désactivée.
     */
    public statusAt(now: Date): InvitationStatus {
        if (this.usedAt !== null) {
            return 'used';
        }
        if (!this.isActive) {
            return 'deactivated';
        }
        if (this.expiresAt !== null && this.expiresAt.getTime() <= now.getTime()) {
            return 'expired';
        }
        return 'active';
    }

    /**
     * Vérifie si l'invitation peut être consommée maintenant.
     *
     * Ordre d'évaluation calqué sur l'historique du code (désactivée > expirée > utilisée) pour
     * garantir une rétro-compatibilité bit-à-bit avec les messages d'erreur précédents.
     */
    public checkUsable(now: Date): InvitationUseCheck {
        if (!this.isActive) {
            return { usable: false, status: 'deactivated', reason: 'Ce lien a été désactivé.' };
        }
        if (this.expiresAt !== null && this.expiresAt.getTime() < now.getTime()) {
            return { usable: false, status: 'expired', reason: 'Ce lien a expiré.' };
        }
        if (this.usedAt !== null) {
            return { usable: false, status: 'used', reason: 'Ce lien a déjà été utilisé.' };
        }
        return { usable: true };
    }

    public markUsed(now: Date): Invitation {
        if (this.usedAt !== null) {
            return this;
        }
        return new Invitation(
            this.id,
            this.token,
            this.participantId,
            this.campaignId,
            this.questionnaireId,
            this.createdAt,
            this.expiresAt,
            now,
            this.isActive
        );
    }

    public deactivate(): Invitation {
        if (!this.isActive) {
            return this;
        }
        return new Invitation(
            this.id,
            this.token,
            this.participantId,
            this.campaignId,
            this.questionnaireId,
            this.createdAt,
            this.expiresAt,
            this.usedAt,
            false
        );
    }

    public activate(): Invitation {
        if (this.isActive) {
            return this;
        }
        return new Invitation(
            this.id,
            this.token,
            this.participantId,
            this.campaignId,
            this.questionnaireId,
            this.createdAt,
            this.expiresAt,
            this.usedAt,
            true
        );
    }

    public extend(newExpiresAt: Date): Invitation {
        return new Invitation(
            this.id,
            this.token,
            this.participantId,
            this.campaignId,
            this.questionnaireId,
            this.createdAt,
            newExpiresAt,
            this.usedAt,
            this.isActive
        );
    }

    public isPersisted(): boolean {
        return this.id > 0;
    }
}
