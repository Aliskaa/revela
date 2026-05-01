// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IPasswordVerifierPort } from '@aor/ports';

import {
    ParticipantEmailRequiredError,
    ParticipantFirstNameRequiredError,
    ParticipantLastNameRequiredError,
    ParticipantPasswordHashRequiredError,
} from './participants.errors';

export type ParticipantFunctionLevel = 'direction' | 'middle_management' | 'frontline_manager';

export type ParticipantProfilePatch = {
    organisation?: string | null;
    direction?: string | null;
    service?: string | null;
    functionLevel?: ParticipantFunctionLevel | null;
};

const normalizeEmail = (raw: string): string => raw.trim().toLowerCase();
const normalizeName = (raw: string): string => raw.trim();

/**
 * Entité Participant.
 *
 * Comme pour `Coach`, le `#passwordHash` est stocké dans un champ privé ECMAScript : il
 * n'apparaît ni dans `JSON.stringify`, ni dans un spread `{...p}`, ni dans un destructuring.
 * Toute interaction passe par `verifyPassword()` (auth) ou `persistenceSnapshot()` (repo).
 *
 * Le participant peut exister **sans mot de passe** (`passwordHash = null`) : il a été créé
 * par l'admin via import CSV ou invitation, mais n'a pas encore activé son compte. Dans cet
 * état, `isActivated()` renvoie `false` et `verifyPassword()` renvoie `false`.
 */
export class Participant {
    readonly #passwordHash: string | null;

    private constructor(
        public readonly id: number,
        public readonly companyId: number | null,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly organisation: string | null,
        public readonly direction: string | null,
        public readonly service: string | null,
        public readonly functionLevel: ParticipantFunctionLevel | null,
        passwordHash: string | null,
        public readonly createdAt: Date | null
    ) {
        this.#passwordHash = passwordHash;
        Object.freeze(this);
    }

    public static create(props: {
        companyId?: number | null;
        firstName: string;
        lastName: string;
        email: string;
    }): Participant {
        const firstName = normalizeName(props.firstName);
        if (firstName.length === 0) {
            throw new ParticipantFirstNameRequiredError();
        }
        const lastName = normalizeName(props.lastName);
        if (lastName.length === 0) {
            throw new ParticipantLastNameRequiredError();
        }
        const email = normalizeEmail(props.email);
        if (email.length === 0) {
            throw new ParticipantEmailRequiredError();
        }
        return new Participant(
            0,
            props.companyId ?? null,
            firstName,
            lastName,
            email,
            null,
            null,
            null,
            null,
            null,
            null
        );
    }

    public static hydrate(props: {
        id: number;
        companyId: number | null;
        firstName: string;
        lastName: string;
        email: string;
        organisation: string | null;
        direction: string | null;
        service: string | null;
        functionLevel: ParticipantFunctionLevel | null;
        passwordHash: string | null;
        createdAt: Date | null;
    }): Participant {
        return new Participant(
            props.id,
            props.companyId,
            props.firstName,
            props.lastName,
            props.email,
            props.organisation,
            props.direction,
            props.service,
            props.functionLevel,
            props.passwordHash,
            props.createdAt
        );
    }

    public setCompanyId(companyId: number | null): Participant {
        if (companyId === this.companyId) {
            return this;
        }
        return new Participant(
            this.id,
            companyId,
            this.firstName,
            this.lastName,
            this.email,
            this.organisation,
            this.direction,
            this.service,
            this.functionLevel,
            this.#passwordHash,
            this.createdAt
        );
    }

    /**
     * Applique un patch partiel de profil. Les clés absentes du patch ne sont pas modifiées ;
     * une valeur explicite `null` efface le champ.
     */
    public updateProfile(patch: ParticipantProfilePatch): Participant {
        return new Participant(
            this.id,
            this.companyId,
            this.firstName,
            this.lastName,
            this.email,
            patch.organisation !== undefined ? patch.organisation : this.organisation,
            patch.direction !== undefined ? patch.direction : this.direction,
            patch.service !== undefined ? patch.service : this.service,
            patch.functionLevel !== undefined ? patch.functionLevel : this.functionLevel,
            this.#passwordHash,
            this.createdAt
        );
    }

    public setPasswordHash(hash: string): Participant {
        if (hash.length === 0) {
            throw new ParticipantPasswordHashRequiredError();
        }
        return new Participant(
            this.id,
            this.companyId,
            this.firstName,
            this.lastName,
            this.email,
            this.organisation,
            this.direction,
            this.service,
            this.functionLevel,
            hash,
            this.createdAt
        );
    }

    public isActivated(): boolean {
        return this.#passwordHash !== null;
    }

    /**
     * Vérifie un mot de passe en clair. Si le participant n'a pas de mot de passe, retourne
     * toujours `false` (ne lance pas d'exception — à l'appelant de séparer les cas via
     * `isActivated()` si nécessaire).
     */
    public verifyPassword(plainPassword: string, verifier: IPasswordVerifierPort): boolean {
        if (this.#passwordHash === null) {
            return false;
        }
        return verifier.verify(plainPassword, this.#passwordHash);
    }

    public isPersisted(): boolean {
        return this.id > 0;
    }

    /**
     * Snapshot destiné **uniquement** aux adapters de persistance. Le hash y figure.
     * Ne jamais appeler depuis un controller/presenter.
     */
    public persistenceSnapshot(): {
        id: number;
        companyId: number | null;
        firstName: string;
        lastName: string;
        email: string;
        organisation: string | null;
        direction: string | null;
        service: string | null;
        functionLevel: ParticipantFunctionLevel | null;
        passwordHash: string | null;
        createdAt: Date | null;
    } {
        return {
            id: this.id,
            companyId: this.companyId,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            organisation: this.organisation,
            direction: this.direction,
            service: this.service,
            functionLevel: this.functionLevel,
            passwordHash: this.#passwordHash,
            createdAt: this.createdAt,
        };
    }
}
