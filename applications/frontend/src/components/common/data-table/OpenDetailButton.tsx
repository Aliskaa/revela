// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';

export type OpenDetailButtonProps = {
    /** URL vers la page détail (relative ou absolue). */
    to: string;
    /**
     * `table` (défaut) : Button text + ChevronRight, pensé pour la dernière cellule d'une row.
     * `outlined` : bouton borduré pour les listes admin.
     * `card` : Button contained primary + ChevronRight, pensé pour l'action principale d'une card mobile.
     */
    variant?: 'table' | 'outlined' | 'card';
    /** Label affiché. Défaut « Ouvrir ». */
    label?: string;
    /** Optionnel — utile quand le label seul ne décrit pas la ligne ciblée (lecteurs d'écran). */
    ariaLabel?: string;
};

/**
 * Bouton standardisé d'accès au détail depuis une ligne ou une card.
 * Centralise label / icône / styles pour rester cohérent entre toutes les listes.
 */
export function OpenDetailButton({ to, variant = 'table', label = 'Ouvrir', ariaLabel }: OpenDetailButtonProps) {
    if (variant === 'outlined') {
        return (
            <Button
                component={Link}
                to={to}
                variant="outlined"
                size="small"
                aria-label={ariaLabel}
                sx={{
                    borderRadius: 2,
                    borderColor: 'tint.primaryRail',
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 3,
                    py: 0.75,
                    textTransform: 'none',
                    '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderColor: 'primary.main',
                    },
                }}
            >
                {label}
            </Button>
        );
    }
    if (variant === 'card') {
        return (
            <Button
                variant="contained"
                disableElevation
                href={to}
                endIcon={<ChevronRight size={16} />}
                aria-label={ariaLabel}
                sx={{ bgcolor: 'primary.main', width: 'fit-content' }}
            >
                {label}
            </Button>
        );
    }
    return (
        <Button href={to} variant="text" endIcon={<ChevronRight size={16} />} aria-label={ariaLabel}>
            {label}
        </Button>
    );
}
