import { TablePagination } from '@mui/material';

export type StandardTablePaginationProps = {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
};

/**
 * `<TablePagination>` MUI préconfiguré avec les libellés français, options par défaut et signature
 * simplifiée — évite que chaque route redéfinisse les mêmes `labelRowsPerPage` / `labelDisplayedRows`.
 */
export function StandardTablePagination({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 25, 50],
}: StandardTablePaginationProps) {
    return (
        <TablePagination
            component="div"
            count={count}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => onRowsPerPageChange(Number(e.target.value))}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count: total }) => `${from}–${to} sur ${total}`}
        />
    );
}
