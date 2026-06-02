// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/**
 * Normaliseurs d'entrées de query partagés (ADR-009 §4 — frontière transport ADR-008 §5).
 *
 * Centralise les helpers `normalizeQid` / `normalizePositiveInt` qui étaient copiés à
 * l'identique en méthodes statiques privées dans `admin-responses` et `admin-participants`
 * (et `normalizeQid` une 3ᵉ fois dans `participant.controller`). Fonctions pures, sans
 * dépendance Nest ni application/domaine : la pagination, elle, passe par
 * [`PaginationQueryPipe`](./pagination-query.pipe.ts) (couple `page` / `per_page` cohérent).
 */

/** `qid` de questionnaire : trim + majuscules ; chaîne vide ⇒ `undefined` (filtre absent). */
export const normalizeQid = (raw?: string): string | undefined => {
    const qid = (raw ?? '').trim().toUpperCase();
    return qid.length > 0 ? qid : undefined;
};

/** Entier strictement positif issu d'une query (id de filtre) ; sinon `undefined`. */
export const normalizePositiveInt = (raw?: string): number | undefined => {
    if (raw === undefined || raw.trim() === '') {
        return undefined;
    }
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : undefined;
};
