// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { CompanyNameRequiredError } from './companies.errors';

/**
 * Entité write-side Company.
 *
 * Immutable : les mutations retournent une nouvelle instance (`rename`, `updateContact`).
 * Les champs exposés conservent les mêmes noms que l'ancien `CompanyRecord` pour que les
 * consommateurs cross-feature qui lisent `.id`/`.name`/`.contactName` continuent de fonctionner
 * sans modification.
 *
 * Constructeur privé : la construction passe par `Company.create()` (nouvelle entité, id=0)
 * ou `Company.hydrate()` (restauration depuis la persistance, sans re-validation).
 */
export class Company {
    private constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly contactName: string | null,
        public readonly contactEmail: string | null,
        public readonly createdAt: Date | null
    ) {
        Object.freeze(this);
    }

    /**
     * Crée une nouvelle entité (non encore persistée). `id = 0` est le sentinelle d'absence
     * d'identifiant ; le repository le remplacera lors du `create()`.
     */
    public static create(props: {
        name: string;
        contactName?: string | null;
        contactEmail?: string | null;
    }): Company {
        const trimmedName = props.name.trim();
        if (trimmedName.length === 0) {
            throw new CompanyNameRequiredError();
        }
        return new Company(0, trimmedName, props.contactName ?? null, props.contactEmail ?? null, null);
    }

    /**
     * Restaure une entité depuis la persistance. Ne ré-applique pas les invariants métier —
     * ce qui est en DB est présumé valide. À n'utiliser que depuis les adapters (repos).
     */
    public static hydrate(props: {
        id: number;
        name: string;
        contactName: string | null;
        contactEmail: string | null;
        createdAt: Date | null;
    }): Company {
        return new Company(props.id, props.name, props.contactName, props.contactEmail, props.createdAt);
    }

    /** Retourne une nouvelle entité renommée. Valide l'invariant nom non vide. */
    public rename(newName: string): Company {
        const trimmedName = newName.trim();
        if (trimmedName.length === 0) {
            throw new CompanyNameRequiredError();
        }
        if (trimmedName === this.name) {
            return this;
        }
        return new Company(this.id, trimmedName, this.contactName, this.contactEmail, this.createdAt);
    }

    /** Retourne une nouvelle entité avec les coordonnées de contact mises à jour. */
    public updateContact(contactName: string | null, contactEmail: string | null): Company {
        return new Company(this.id, this.name, contactName, contactEmail, this.createdAt);
    }

    /** `true` si l'entité a déjà été persistée (id attribué). */
    public isPersisted(): boolean {
        return this.id > 0;
    }
}
