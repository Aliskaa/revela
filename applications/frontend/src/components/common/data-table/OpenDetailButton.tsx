// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@mui/material';
import { ChevronRight } from 'lucide-react';

export type OpenDetailButtonProps = {
    /** URL vers la page détail (relative ou absolue). */
    to: string;
    /**
     * `table` (défaut) : Button text + ChevronRight, pensé pour la dernière cellule d'une row.
     * `card` : Button contained primary + ChevronRight, pensé pour l'action principale d'une card mobile.
     */
    variant?: 'table' | 'card';
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
    if (variant === 'card') {
        return (
            <Button
                variant="contained"
                disableElevation
                href={to}
                endIcon={<ChevronRight size={16} />}
                aria-label={ariaLabel}
                sx={{ borderRadius: 3, bgcolor: 'primary.main', width: 'fit-content' }}
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
