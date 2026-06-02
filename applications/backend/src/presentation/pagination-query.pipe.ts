// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { PipeTransform } from '@nestjs/common';

/**
 * Pagination normalisée et bornée (ADR-009 §4 — frontière transport ADR-008 §5).
 *
 * Unifie les **trois** parseurs de pagination divergents de la branche admin :
 * - `normalizePage` / `normalizePerPage` copiés à l'identique dans `admin-responses`
 *   et `admin-participants` ;
 * - la variante inline `Number.parseInt(page, 10) || 1` d'`admin-audit`.
 *
 * Appliqué sur l'objet query complet : `@Query(PaginationQueryPipe) { page, perPage }`.
 * Lit `page` / `per_page` (snake_case côté transport) et renvoie un couple typé
 * `{ page, perPage }` (camelCase côté use case). Valeurs par défaut et plafond
 * configurables par instance : `@Query(new PaginationQueryPipe({ defaultPerPage, maxPerPage }))`.
 */
export interface PaginationParams {
    readonly page: number;
    readonly perPage: number;
}

export interface PaginationQueryOptions {
    readonly defaultPerPage?: number;
    readonly maxPerPage?: number;
}

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 200;

const toRawString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const normalizePage = (raw: unknown): number => {
    const value = Number(toRawString(raw) ?? 1);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
};

const normalizePerPage = (raw: unknown, defaultPerPage: number, maxPerPage: number): number => {
    const value = Number(toRawString(raw) ?? defaultPerPage);
    const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultPerPage;
    return Math.min(safe, maxPerPage);
};

export class PaginationQueryPipe implements PipeTransform {
    private readonly defaultPerPage: number;
    private readonly maxPerPage: number;

    public constructor(options: PaginationQueryOptions = {}) {
        this.defaultPerPage = options.defaultPerPage ?? DEFAULT_PER_PAGE;
        this.maxPerPage = options.maxPerPage ?? MAX_PER_PAGE;
    }

    public transform(value: unknown): PaginationParams {
        const query = (value ?? {}) as Record<string, unknown>;
        return {
            page: normalizePage(query.page),
            perPage: normalizePerPage(query.per_page, this.defaultPerPage, this.maxPerPage),
        };
    }
}
