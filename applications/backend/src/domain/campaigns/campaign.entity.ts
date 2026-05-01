// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { CampaignStatus } from '@aor/types';

import {
    CampaignInvalidStatusError,
    CampaignNameTooShortError,
    CampaignQuestionnaireRequiredError,
    CampaignScheduleInvalidError,
} from './campaigns.errors';

export type { CampaignStatus };

const MIN_NAME_LENGTH = 3;
const VALID_STATUSES: readonly CampaignStatus[] = ['draft', 'active', 'closed', 'archived'] as const;

const isValidStatus = (raw: string): raw is CampaignStatus => (VALID_STATUSES as readonly string[]).includes(raw);

/**
 * Entité Campaign avec machine à états `draft | active | closed | archived`.
 *
 * Les transitions sont *libres* actuellement (pas de graphe de transitions strict) pour rester
 * rétro-compatible avec l'ancienne API. On pourrait durcir vers un graphe `draft → active →
 * closed → archived` plus tard en ajoutant une validation dans `transitionTo`.
 */
export class Campaign {
    private constructor(
        public readonly id: number,
        public readonly coachId: number,
        public readonly companyId: number,
        public readonly name: string,
        public readonly questionnaireId: string | null,
        public readonly status: CampaignStatus,
        public readonly allowTestWithoutManualInputs: boolean,
        public readonly startsAt: Date | null,
        public readonly endsAt: Date | null,
        public readonly createdAt: Date | null
    ) {
        Object.freeze(this);
    }

    public static create(props: {
        coachId: number;
        companyId: number;
        name: string;
        questionnaireId: string;
        status?: CampaignStatus;
        allowTestWithoutManualInputs?: boolean;
        startsAt?: Date | null;
        endsAt?: Date | null;
    }): Campaign {
        const name = props.name.trim();
        if (name.length < MIN_NAME_LENGTH) {
            throw new CampaignNameTooShortError();
        }
        const questionnaireId = props.questionnaireId.trim().toUpperCase();
        if (questionnaireId.length === 0) {
            throw new CampaignQuestionnaireRequiredError();
        }
        if (props.startsAt && props.endsAt && props.startsAt > props.endsAt) {
            throw new CampaignScheduleInvalidError();
        }
        return new Campaign(
            0,
            props.coachId,
            props.companyId,
            name,
            questionnaireId,
            props.status ?? 'draft',
            props.allowTestWithoutManualInputs ?? false,
            props.startsAt ?? null,
            props.endsAt ?? null,
            null
        );
    }

    public static hydrate(props: {
        id: number;
        coachId: number;
        companyId: number;
        name: string;
        questionnaireId: string | null;
        status: CampaignStatus;
        allowTestWithoutManualInputs: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
        createdAt: Date | null;
    }): Campaign {
        return new Campaign(
            props.id,
            props.coachId,
            props.companyId,
            props.name,
            props.questionnaireId,
            props.status,
            props.allowTestWithoutManualInputs,
            props.startsAt,
            props.endsAt,
            props.createdAt
        );
    }

    /**
     * Transition libre vers un autre statut. Si `alignStartsAtToNow` est vrai et qu'on passe
     * à `active`, `startsAt` est écrasé par la date fournie (typiquement `new Date()`).
     */
    public transitionTo(nextStatus: CampaignStatus, options?: { alignStartsAtToNow?: Date }): Campaign {
        if (!isValidStatus(nextStatus)) {
            throw new CampaignInvalidStatusError(nextStatus);
        }
        if (nextStatus === this.status && options?.alignStartsAtToNow === undefined) {
            return this;
        }
        const nextStartsAt =
            nextStatus === 'active' && options?.alignStartsAtToNow !== undefined
                ? options.alignStartsAtToNow
                : this.startsAt;
        return new Campaign(
            this.id,
            this.coachId,
            this.companyId,
            this.name,
            this.questionnaireId,
            nextStatus,
            this.allowTestWithoutManualInputs,
            nextStartsAt,
            this.endsAt,
            this.createdAt
        );
    }

    public reassignTo(coachId: number): Campaign {
        if (coachId === this.coachId) {
            return this;
        }
        return new Campaign(
            this.id,
            coachId,
            this.companyId,
            this.name,
            this.questionnaireId,
            this.status,
            this.allowTestWithoutManualInputs,
            this.startsAt,
            this.endsAt,
            this.createdAt
        );
    }

    public isArchived(): boolean {
        return this.status === 'archived';
    }

    public isActive(): boolean {
        return this.status === 'active';
    }

    public isPersisted(): boolean {
        return this.id > 0;
    }

    public persistenceSnapshot(): {
        id: number;
        coachId: number;
        companyId: number;
        name: string;
        questionnaireId: string | null;
        status: CampaignStatus;
        allowTestWithoutManualInputs: boolean;
        startsAt: Date | null;
        endsAt: Date | null;
        createdAt: Date | null;
    } {
        return {
            id: this.id,
            coachId: this.coachId,
            companyId: this.companyId,
            name: this.name,
            questionnaireId: this.questionnaireId,
            status: this.status,
            allowTestWithoutManualInputs: this.allowTestWithoutManualInputs,
            startsAt: this.startsAt,
            endsAt: this.endsAt,
            createdAt: this.createdAt,
        };
    }
}
