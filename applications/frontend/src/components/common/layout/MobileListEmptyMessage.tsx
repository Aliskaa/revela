import { Typography } from '@mui/material';

export type MobileListEmptyMessageProps = {
    message: string;
};

/** Message centré affiché dans la vue mobile quand la liste est vide. */
export function MobileListEmptyMessage({ message }: MobileListEmptyMessageProps) {
    return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            {message}
        </Typography>
    );
}
