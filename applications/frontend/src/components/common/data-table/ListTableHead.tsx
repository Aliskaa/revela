// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { TableCell, TableHead, TableRow } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type * as React from 'react';

import { listTableHeadCellSx } from '@/components/common/styles/listSurfaces';

export type ListTableColumn = {
    /** Clé stable pour le rendu (évite les clés indexées). */
    key: string;
    /** Libellé affiché. Omis pour une colonne d'action sans titre. Accepte un `TableSortLabel`. */
    label?: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    /** Surcharge ponctuelle de la cellule (padding de bord, largeur…). */
    sx?: SxProps<Theme>;
};

export type ListTableHeadProps = {
    columns: ListTableColumn[];
};

/**
 * En-tête harmonisé des tables de liste admin : cellules sur fond lavande, libellés en
 * capitales. Centralise le style auparavant recopié colonne par colonne dans chaque liste.
 */
export function ListTableHead({ columns }: ListTableHeadProps) {
    return (
        <TableHead>
            <TableRow>
                {columns.map(column => (
                    <TableCell
                        key={column.key}
                        align={column.align}
                        sx={{ ...listTableHeadCellSx, ...column.sx } as SxProps<Theme>}
                    >
                        {column.label}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}
