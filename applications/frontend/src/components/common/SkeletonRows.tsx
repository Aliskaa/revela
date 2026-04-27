// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Skeleton, TableCell, TableRow } from '@mui/material';
import * as React from 'react';

/**
 * Génère des identifiants stables pour les éléments d'un placeholder.
 *
 * Pourquoi ne pas utiliser l'index ? `lint/suspicious/noArrayIndexKey` (Biome) déconseille les
 * clés indexées car elles cassent la réconciliation React quand l'ordre change. Pour des skeletons
 * statiques, le risque est nul, mais centraliser ici évite de désactiver la règle dans 6 fichiers
 * et fournit un point unique pour toutes les variantes de placeholders. Les ids sont mémoïsés
 * sur `count` : tant que la longueur ne change pas, les clés restent stables au render.
 */
function useStableIds(count: number): string[] {
    return React.useMemo(() => Array.from({ length: count }, () => crypto.randomUUID()), [count]);
}

export type SkeletonTableRowsProps = {
    /** Nombre de lignes à afficher pendant le chargement. */
    rows: number;
    /** Nombre de cellules par ligne (en général le nombre de colonnes du `TableHead`). */
    columns: number;
};

/**
 * Squelette de chargement pour les tables MUI : `rows × columns` cellules `<Skeleton variant="text" />`.
 * Pattern auparavant dupliqué dans toutes les routes admin avec `Array.from(...).map((_, i) => …)`,
 * ce qui faisait remonter `noArrayIndexKey` à chaque appel.
 */
export function SkeletonTableRows({ rows, columns }: SkeletonTableRowsProps) {
    const rowIds = useStableIds(rows);
    const columnIds = useStableIds(columns);
    return (
        <>
            {rowIds.map(rowId => (
                <TableRow key={rowId}>
                    {columnIds.map(columnId => (
                        <TableCell key={columnId}>
                            <Skeleton variant="text" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export type SkeletonCardsProps = {
    /** Nombre de cartes placeholder. */
    count: number;
    /** Hauteur en px (transmise telle quelle à `Skeleton`). */
    height: number;
};

/**
 * Squelette pour les listes de cartes (vue mobile des routes admin) : N `<Skeleton variant="rounded" />`
 * **sans wrapper** — on retourne un Fragment pour laisser le `Stack` parent gérer le layout, comme
 * dans le pattern `Array.from(...).map((_, i) => <Skeleton key={i} … />)` qu'il remplace.
 */
export function SkeletonCards({ count, height }: SkeletonCardsProps) {
    const ids = useStableIds(count);
    return (
        <>
            {ids.map(id => (
                <Skeleton key={id} variant="rounded" height={height} />
            ))}
        </>
    );
}
