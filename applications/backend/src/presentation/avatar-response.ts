// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Response } from 'express';

/**
 * Politique de cache des avatars (ADR-009 §4 — frontière transport ADR-008 §5).
 *
 * `private` : réponse spécifique à l'utilisateur authentifié, jamais mise en cache
 * partagé (proxy/CDN). `max-age=86400` (24 h) : l'URL porte un paramètre `?v=` (timestamp
 * de session) invalidé après un nouvel upload, donc un cache long est sûr.
 */
const AVATAR_CACHE_CONTROL = 'private, max-age=86400';

/**
 * Émet une réponse binaire d'avatar : `Content-Type` du média + l'en-tête de cache
 * partagé ci-dessus, puis le corps. Remplace le triplet
 * `setHeader(Content-Type) / setHeader(Cache-Control) / send(buffer)` répété à l'identique
 * dans les 6 handlers d'avatar (admin coaches/companies/participants + participant
 * self/coach/peer). Concern transport pur : aucune logique métier.
 */
export const sendAvatarResponse = (
    res: Response,
    avatar: { readonly buffer: Buffer; readonly mimeType: string }
): void => {
    res.setHeader('Content-Type', avatar.mimeType);
    res.setHeader('Cache-Control', AVATAR_CACHE_CONTROL);
    res.send(avatar.buffer);
};
