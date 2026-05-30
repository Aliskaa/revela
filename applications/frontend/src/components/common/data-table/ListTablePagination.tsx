// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { TablePagination, type TablePaginationProps } from './TablePagination';

export const LIST_TABLE_EDGE_PADDING = 5;
export const LIST_TABLE_ROWS_PER_PAGE_OPTIONS = [10, 25, 50] as const;

export type ListTablePaginationProps = Omit<TablePaginationProps, 'edgePadding' | 'rowsPerPageOptions'>;

/** Pagination numérotée des listes admin. (Entreprises, Campagnes, Audit log…). */
export function ListTablePagination(props: ListTablePaginationProps) {
    return (
        <TablePagination
            edgePadding={LIST_TABLE_EDGE_PADDING}
            rowsPerPageOptions={[...LIST_TABLE_ROWS_PER_PAGE_OPTIONS]}
            {...props}
        />
    );
}
