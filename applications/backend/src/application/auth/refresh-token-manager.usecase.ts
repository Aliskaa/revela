// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createHash, randomBytes, randomUUID } from 'node:crypto';

import type {
    IRefreshTokensRepositoryPort,
    RefreshTokenSubjectType,
} from '@src/interfaces/auth/IRefreshTokensRepository.port';

/** Durée de vie d'un refresh token (30 jours). */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Longueur du token brut généré (en octets, hex × 2 → 128 caractères). */
const REFRESH_TOKEN_BYTES = 64;

/** Erreur levée lors d'un rotate échoué (token inconnu, expiré, révoqué ou réutilisé). */
export class RefreshTokenInvalidError extends Error {
    public constructor(message = 'Refresh token invalide ou expiré.') {
        super(message);
        this.name = 'RefreshTokenInvalidError';
    }
}

export type IssuedRefreshToken = {
    /** Token brut à renvoyer au client (cookie httpOnly). N'est jamais persisté en BDD. */
    rawToken: string;
    /** ID en base de l'enregistrement créé. */
    tokenId: number;
    /** UUID de la famille de rotation. */
    familyId: string;
    /** Timestamp d'expiration absolu. */
    expiresAt: Date;
};

const sha256Hex = (raw: string): string => createHash('sha256').update(raw, 'utf8').digest('hex');

/**
 * Gestion des refresh tokens (G1 RGPD — auth httpOnly + rotation).
 *
 * Pattern : OWASP "Refresh Token Rotation with Reuse Detection".
 *  - À chaque login → nouvelle famille + nouveau token.
 *  - À chaque utilisation (rotate) → ancien token marqué `usedAt`, nouveau token émis dans
 *    la même famille avec `replacedById = oldTokenId`.
 *  - Si on présente un token déjà `usedAt != null` ou `revokedAt != null` → on revoque toute
 *    la famille (signal fort de vol/replay). L'attaquant ET la victime sont déconnectés.
 *  - À chaque logout → famille entière révoquée.
 */
export class RefreshTokenManagerUseCase {
    public constructor(private readonly refreshTokens: IRefreshTokensRepositoryPort) {}

    /**
     * Émet un nouveau refresh token au login (nouvelle famille). Le token brut n'est
     * jamais persisté en clair — seul son hash SHA-256 hex.
     */
    public async issue(subjectType: RefreshTokenSubjectType, subjectId: number): Promise<IssuedRefreshToken> {
        const familyId = randomUUID();
        return this.persistFresh(subjectType, subjectId, familyId);
    }

    /**
     * Rotate : valide le `rawToken` présenté par le client, marque l'ancien comme utilisé
     * et émet un nouveau token dans la même famille. Retourne le nouveau token brut.
     *
     * @throws RefreshTokenInvalidError si le token est inconnu, expiré, déjà utilisé ou
     *         révoqué. La détection d'un replay (`usedAt != null`) déclenche une revocation
     *         de famille avant de lever l'erreur.
     */
    public async rotate(
        rawToken: string
    ): Promise<IssuedRefreshToken & { subjectType: RefreshTokenSubjectType; subjectId: number }> {
        const hash = sha256Hex(rawToken);
        const record = await this.refreshTokens.findByTokenHash(hash);
        const now = new Date();

        if (!record) {
            throw new RefreshTokenInvalidError();
        }
        // Détection de réutilisation : ce token a déjà été échangé. Quelqu'un (probablement
        // un attaquant qui a volé le cookie) tente de le rejouer. On revoque toute la famille
        // pour bloquer aussi l'utilisateur légitime, qui devra se reconnecter.
        if (record.usedAt !== null) {
            await this.refreshTokens.revokeFamily(record.familyId, now);
            throw new RefreshTokenInvalidError('Refresh token déjà utilisé — session compromise, reconnectez-vous.');
        }
        if (record.revokedAt !== null) {
            throw new RefreshTokenInvalidError('Refresh token révoqué.');
        }
        if (record.expiresAt.getTime() <= now.getTime()) {
            throw new RefreshTokenInvalidError('Refresh token expiré.');
        }

        const fresh = await this.persistFresh(record.subjectType, record.subjectId, record.familyId);
        await this.refreshTokens.markUsed(record.id, fresh.tokenId, now);

        return {
            ...fresh,
            subjectType: record.subjectType,
            subjectId: record.subjectId,
        };
    }

    /**
     * Révoque la famille du token présenté (logout). Si le token est inconnu, no-op
     * silencieux (on ne veut pas leak d'info via l'erreur).
     */
    public async revoke(rawToken: string): Promise<void> {
        const hash = sha256Hex(rawToken);
        const record = await this.refreshTokens.findByTokenHash(hash);
        if (!record) return;
        await this.refreshTokens.revokeFamily(record.familyId, new Date());
    }

    private async persistFresh(
        subjectType: RefreshTokenSubjectType,
        subjectId: number,
        familyId: string
    ): Promise<IssuedRefreshToken> {
        const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
        const tokenHash = sha256Hex(rawToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        const record = await this.refreshTokens.create({
            subjectType,
            subjectId,
            tokenHash,
            familyId,
            expiresAt,
        });
        return { rawToken, tokenId: record.id, familyId, expiresAt };
    }
}

/** TTL en millisecondes — exporté pour synchroniser le `maxAge` du cookie. */
export const REFRESH_TOKEN_TTL_MS_EXPORT = REFRESH_TOKEN_TTL_MS;
