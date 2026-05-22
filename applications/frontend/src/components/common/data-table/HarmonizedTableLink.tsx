import { Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

export type HarmonizedTableLinkProps = {
    to: string;
    label?: string;
};

/** Lien « Ouvrir » harmonisé pour la dernière cellule d'une ligne de tableau admin. */
export function HarmonizedTableLink({ to, label = 'Ouvrir' }: HarmonizedTableLinkProps) {
    return (
        <Typography
            component={Link}
            to={to}
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'transform 0.2s ease',
                '.MuiTableRow-root:hover &': {
                    transform: 'translateX(4px)',
                },
                '&:hover': { textDecoration: 'underline' },
            }}
        >
            {label}
            <ChevronRight size={16} />
        </Typography>
    );
}
