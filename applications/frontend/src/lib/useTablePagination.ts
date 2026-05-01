import * as React from 'react';

import { usePageResetEffect } from './usePageResetEffect';

export type UseTablePaginationOptions<T> = {
    items: T[];
    /** Taille de page initiale. Défaut : 10. */
    initialRowsPerPage?: number;
    /**
     * Dépendances qui, lorsqu'elles changent, doivent réinitialiser la page courante à 0
     * (ex. mise à jour d'un filtre de recherche). Cf. `usePageResetEffect`.
     */
    resetWhen?: ReadonlyArray<unknown>;
};

export type UseTablePaginationReturn<T> = {
    page: number;
    rowsPerPage: number;
    paged: T[];
    setPage: (page: number) => void;
    setRowsPerPage: (rowsPerPage: number) => void;
};

/**
 * Hook centralisant le quartet `page / rowsPerPage / slice / reset` que toutes les routes
 * admin/coach répétaient. Préserve la sémantique : changement de page de filtre → retour à 0.
 */
export function useTablePagination<T>({
    items,
    initialRowsPerPage = 10,
    resetWhen = [],
}: UseTablePaginationOptions<T>): UseTablePaginationReturn<T> {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(initialRowsPerPage);

    const paged = React.useMemo(
        () => items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [items, page, rowsPerPage]
    );

    usePageResetEffect(setPage, resetWhen);

    const handleSetRowsPerPage = React.useCallback((next: number) => {
        setRowsPerPage(next);
        setPage(0);
    }, []);

    return {
        page,
        rowsPerPage,
        paged,
        setPage,
        setRowsPerPage: handleSetRowsPerPage,
    };
}
