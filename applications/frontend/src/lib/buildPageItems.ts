// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export type PageItem = number | 'ellipsis';

/** Construit la séquence de pages affichables avec ellipses (index 0-based). */
export function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
    if (totalPages <= 0) {
        return [];
    }
    if (totalPages <= 5) {
        return Array.from({ length: totalPages }, (_, index) => index);
    }

    const lastPage = totalPages - 1;

    if (currentPage <= 2) {
        return [0, 1, 2, 'ellipsis', lastPage];
    }

    if (currentPage >= lastPage - 2) {
        return [0, 'ellipsis', lastPage - 2, lastPage - 1, lastPage];
    }

    return [0, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', lastPage];
}
