import {
    Box,
    Card,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
} from '@mui/material';
import { type ColumnDef, type TableOptions, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';

export type DataTableProps<TData> = {
    /** Lignes affichées dans le tableau */
    data: TData[];
    /** Définition des colonnes TanStack Table */
    columns: ColumnDef<TData, unknown>[];
    /** Affiche des lignes squelette à la place des données */
    isLoading?: boolean;
    /** Nombre de lignes squelette (par défaut 5) */
    skeletonRowCount?: number;
    /** Largeur minimale du tableau (px), alignée sur les écrans admin */
    minWidth?: number;
    /** Barre au-dessus du tableau (filtres, recherche, actions) */
    toolbar?: React.ReactNode;
    /**
     * Contenu rendu après les lignes de données dans le `tbody`
     * (états vides, message « aucun résultat », etc.)
     */
    afterRows?: React.ReactNode;
    /** Contenu rendu sous le `TableContainer` mais dans la même `Card` (pagination, etc.) */
    footer?: React.ReactNode;
    /** Options TanStack Table (tri, pagination, etc.) — `data`, `columns` et `getCoreRowModel` sont gérés par le composant */
    tableOptions?: Omit<Partial<TableOptions<TData>>, 'data' | 'columns' | 'getCoreRowModel'>;
    /** Props MUI supplémentaires sur la `Card` enveloppe */
    cardSx?: React.ComponentProps<typeof Card>['sx'];
    /** `sx` du `TableContainer` (ex. `maxHeight` + défilement) */
    tableContainerSx?: React.ComponentProps<typeof TableContainer>['sx'];
    /** Taille MUI des cellules */
    size?: React.ComponentProps<typeof Table>['size'];
    /** En-têtes de colonnes fixes au défilement */
    stickyHeader?: boolean;
    /** Libellés d’en-tête cliquables (`TableSortLabel`) lorsque la colonne TanStack est triable */
    sortableHeaders?: boolean;
};

const skeletonRowKeys = (count: number): string[] => Array.from({ length: count }, (_, i) => `data-table-sk-${i}`);

const columnStableKey = <TData,>(col: ColumnDef<TData, unknown>): string => {
    if (typeof col.id === 'string' && col.id.length > 0) {
        return col.id;
    }
    if ('accessorKey' in col && typeof col.accessorKey === 'string') {
        return col.accessorKey;
    }
    return 'col';
};

/**
 * Tableau admin réutilisable : en-têtes stylés, lignes avec survol,
 * support chargement (squelettes) et emplacement `toolbar` / `afterRows`.
 */
export const DataTable = <TData,>({
    data,
    columns,
    isLoading = false,
    skeletonRowCount = 5,
    minWidth = 720,
    toolbar,
    afterRows,
    footer,
    tableOptions,
    cardSx,
    tableContainerSx,
    size,
    stickyHeader = false,
    sortableHeaders = false,
}: DataTableProps<TData>) => {
    const table = useReactTable({
        ...tableOptions,
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const rowKeys = useMemo(() => skeletonRowKeys(skeletonRowCount), [skeletonRowCount]);

    const showToolbar = toolbar != null && toolbar !== false;

    return (
        <Card
            sx={[
                { borderRadius: 2.5, overflow: 'hidden' },
                ...(cardSx ? (Array.isArray(cardSx) ? cardSx : [cardSx]) : []),
            ]}
        >
            {showToolbar ? (
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    {toolbar}
                </Box>
            ) : null}
            <TableContainer sx={tableContainerSx}>
                <Table sx={{ minWidth }} size={size} stickyHeader={stickyHeader}>
                    <TableHead sx={{ bgcolor: 'background.default' }}>
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id}>
                                {hg.headers.map(header => (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: 'text.secondary',
                                            py: stickyHeader ? 1.5 : 2.5,
                                            borderBottom: '2px solid',
                                            borderColor: 'divider',
                                            ...(stickyHeader ? { bgcolor: 'background.default' } : {}),
                                        }}
                                    >
                                        {sortableHeaders && header.column.getCanSort() ? (
                                            <TableSortLabel
                                                active={!!header.column.getIsSorted()}
                                                direction={header.column.getIsSorted() === 'asc' ? 'asc' : 'desc'}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{ '&.Mui-active': { color: 'primary.main' } }}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableSortLabel>
                                        ) : (
                                            flexRender(header.column.columnDef.header, header.getContext())
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {isLoading
                            ? rowKeys.map(rowKey => (
                                  <TableRow key={rowKey}>
                                      {columns.map((col, colIndex) => (
                                          <TableCell
                                              key={`${rowKey}-${colIndex}-${columnStableKey(col)}`}
                                              sx={{ py: 2.5 }}
                                          >
                                              <Skeleton animation="wave" height={28} sx={{ borderRadius: 1 }} />
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))
                            : table.getRowModel().rows.map(row => (
                                  <TableRow
                                      key={row.id}
                                      hover
                                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                  >
                                      {row.getVisibleCells().map(cell => (
                                          <TableCell key={cell.id} sx={{ py: size === 'small' ? 1 : 2 }}>
                                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                          </TableCell>
                                      ))}
                                  </TableRow>
                              ))}
                        {afterRows}
                    </TableBody>
                </Table>
            </TableContainer>
            {footer}
        </Card>
    );
};
