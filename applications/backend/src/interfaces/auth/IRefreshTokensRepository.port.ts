// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL = Symbol('REFRESH_TOKENS_REPOSITORY_PORT_SYMBOL');

/**
 * Type d'acteur propriétaire du refresh token. `admin` couvre super-admin et coach (mêmes
 * `coachesTable` côté DB), `participant` couvre les participants de campagnes.
 */
export type RefreshTokenSubjectType = 'admin' | 'participant';

/** DTO d'enregistrement renvoyé par les méthodes de lecture du repo. */
export type RefreshTokenRecord = {
    id: number;
    subjectType: RefreshTokenSubjectType;
    subjectId: number;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    usedAt: Date | null;
    replacedById: number | null;
    revokedAt: Date | null;
    createdAt: Date;
};

export type CreateRefreshTokenInput = {
    subjectType: RefreshTokenSubjectType;
    subjectId: number;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
};

export interface IRefreshTokensRepositoryPort {
    /**
     * Insère un nouveau refresh token. Le `tokenHash` est UNIQUE (contrainte DB), une
     * collision SHA-256 est cryptographiquement improbable mais lèverait une erreur SQL.
     */
    create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;

    findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

    /**
     * Marque le token comme utilisé (rotation) et lie le token de remplacement. Atomic :
     * fait dans la même transaction que l'insertion du token enfant côté use case.
     */
    markUsed(tokenId: number, replacedById: number, usedAt: Date): Promise<void>;

    /**
     * Révoque tous les tokens (passés ET courants) d'une même famille — utilisé en cas de
     * détection de réutilisation (token theft) ou de logout volontaire.
     */
    revokeFamily(familyId: string, revokedAt: Date): Promise<void>;

    /**
     * Révoque toutes les familles d'un sujet donné — utile pour un "logout from all devices".
     * Optionnel pour le MVP.
     */
    revokeAllForSubject(subjectType: RefreshTokenSubjectType, subjectId: number, revokedAt: Date): Promise<void>;
}
