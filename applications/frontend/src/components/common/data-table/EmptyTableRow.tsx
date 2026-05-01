import { TableCell, TableRow, Typography } from '@mui/material';

export type EmptyTableRowProps = {
    colSpan: number;
    message: string;
};

export function EmptyTableRow({ colSpan, message }: EmptyTableRowProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </TableCell>
        </TableRow>
    );
}
