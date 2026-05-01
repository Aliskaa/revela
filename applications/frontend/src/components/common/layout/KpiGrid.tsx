import { Box } from '@mui/material';
import type * as React from 'react';

export type KpiGridProps = {
    /** Nombre de colonnes en desktop (md+). Mobile reste sur une seule colonne. */
    columns?: 2 | 3 | 4;
    children: React.ReactNode;
};

/**
 * Grille responsive 1 → N colonnes pour aligner les `StatCard` de KPI en haut de page.
 * Centralise la définition des points de rupture (avant : `gridTemplateColumns: { xs: '1fr', md: 'repeat(N, ...)' }`
 * répété dans toutes les routes).
 */
export function KpiGrid({ columns = 4, children }: KpiGridProps) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, minmax(0, 1fr))` },
                gap: 2,
            }}
        >
            {children}
        </Box>
    );
}
