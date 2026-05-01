// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IPasswordVerifierPort } from '@aor/ports';

import {
    CoachDisplayNameTooShortError,
    CoachPasswordHashRequiredError,
    CoachUsernameTooShortError,
} from './coaches.errors';

const MIN_USERNAME_LENGTH = 3;
const MIN_DISPLAY_NAME_LENGTH = 2;

const normalizeUsername = (raw: string): string => raw.trim().toLowerCase();
const normalizeDisplayName = (raw: string): string => raw.trim();

/**
 * Entité write-side Coach.
 *
 * Le hash de mot de passe est stocké dans un **champ privé ECMAScript** (`#passwordHash`)
 * et non dans un `private` TypeScript : il n'apparaît pas dans `JSON.stringify`, ce qui prévient
 * les fuites accidentelles via un presenter naïf. Toute interaction avec le hash passe par des
 * méthodes explicites : `verifyPassword()` pour l'auth, `persistenceSnapshot()` pour le repo.
 */
export class Coach {
    readonly #passwordHash: string;

    private constructor(
        public readonly id: number,
        public readonly username: string,
        passwordHash: string,
        public readonly displayName: string,
        public readonly isActive: boolean,
        public readonly createdAt: Date | null
    ) {
        this.#passwordHash = passwordHash;
        Object.freeze(this);
    }

    /**
     * Crée une nouvelle entité (non persistée). `passwordHash` doit déjà être hashé par
     * l'adapter (`IPasswordHasherPort`) en amont — le domaine n'orchestre pas le hashing.
     * Par défaut, un nouveau coach est actif.
     */
    public static create(props: { username: string; passwordHash: string; displayName: string }): Coach {
        const username = normalizeUsername(props.username);
        if (username.length < MIN_USERNAME_LENGTH) {
            throw new CoachUsernameTooShortError();
        }
        if (props.passwordHash.length === 0) {
            throw new CoachPasswordHashRequiredError();
        }
        const displayName = normalizeDisplayName(props.displayName);
        if (displayName.length < MIN_DISPLAY_NAME_LENGTH) {
            throw new CoachDisplayNameTooShortError();
        }
        return new Coach(0, username, props.passwordHash, displayName, true, null);
    }

    /** Restauration depuis la persistance. Pas de re-validation. */
    public static hydrate(props: {
        id: number;
        username: string;
        passwordHash: string;
        displayName: string;
        isActive: boolean;
        createdAt: Date | null;
    }): Coach {
        return new Coach(
            props.id,
            props.username,
            props.passwordHash,
            props.displayName,
            props.isActive,
            props.createdAt
        );
    }

    public rename(newUsername: string): Coach {
        const username = normalizeUsername(newUsername);
        if (username.length < MIN_USERNAME_LENGTH) {
            throw new CoachUsernameTooShortError();
        }
        if (username === this.username) {
            return this;
        }
        return new Coach(this.id, username, this.#passwordHash, this.displayName, this.isActive, this.createdAt);
    }

    public changeDisplayName(newName: string): Coach {
        const displayName = normalizeDisplayName(newName);
        if (displayName.length < MIN_DISPLAY_NAME_LENGTH) {
            throw new CoachDisplayNameTooShortError();
        }
        if (displayName === this.displayName) {
            return this;
        }
        return new Coach(this.id, this.username, this.#passwordHash, displayName, this.isActive, this.createdAt);
    }

    public changePasswordHash(newHash: string): Coach {
        if (newHash.length === 0) {
            throw new CoachPasswordHashRequiredError();
        }
        return new Coach(this.id, this.username, newHash, this.displayName, this.isActive, this.createdAt);
    }

    public activate(): Coach {
        if (this.isActive) {
            return this;
        }
        return new Coach(this.id, this.username, this.#passwordHash, this.displayName, true, this.createdAt);
    }

    public deactivate(): Coach {
        if (!this.isActive) {
            return this;
        }
        return new Coach(this.id, this.username, this.#passwordHash, this.displayName, false, this.createdAt);
    }

    public setActive(active: boolean): Coach {
        return active ? this.activate() : this.deactivate();
    }

    /**
     * Vérifie un mot de passe en clair contre le hash interne. Le hash ne quitte jamais l'entité :
     * c'est le verifier (adapter) qui reçoit le hash via ce canal explicite.
     */
    public verifyPassword(plainPassword: string, verifier: IPasswordVerifierPort): boolean {
        return verifier.verifyOrPlaintextLegacy(plainPassword, this.#passwordHash);
    }

    public isPersisted(): boolean {
        return this.id > 0;
    }

    /**
     * Snapshot destiné **uniquement** aux adapters de persistance. Le hash y figure car la DB
     * en a besoin. N'appeler que depuis les repositories ; **jamais** depuis les controllers
     * ou presenters.
     */
    public persistenceSnapshot(): {
        id: number;
        username: string;
        passwordHash: string;
        displayName: string;
        isActive: boolean;
        createdAt: Date | null;
    } {
        return {
            id: this.id,
            username: this.username,
            passwordHash: this.#passwordHash,
            displayName: this.displayName,
            isActive: this.isActive,
            createdAt: this.createdAt,
        };
    }
}
