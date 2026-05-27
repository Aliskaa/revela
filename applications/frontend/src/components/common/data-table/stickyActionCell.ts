// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/**
 * Styles à appliquer sur la `<TableCell>` body de la colonne d'action (dernière à droite)
 * pour qu'elle reste visible quand le tableau scrolle horizontalement.
 *
 * Le scroll horizontal est porté par `StickyActionTableScroll` (ou un parent
 * `<Box sx={{ overflowX: 'auto' }}>`) qui englobe **uniquement** le `<Table>`.
 * Aucun ancêtre entre ce conteneur et la cellule ne doit avoir `overflow: hidden`.
 *
 * Cible : Mac 13" et autres écrans dont la largeur n'absorbe pas le `minWidth` du tableau.
 */
export const stickyActionCellSx: SxProps<Theme> = {
    position: 'sticky',
    right: 0,
    bgcolor: 'background.paper',
    zIndex: 2,
    minWidth: 120,
    whiteSpace: 'nowrap',
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
    boxShadow: theme => theme.palette.shadow.stickyAction,
    'tr:hover &': { bgcolor: 'surface.lavenderGreyHover' },
};

/**
 * Variante pour la cellule d'en-tête (`<TableHead> > <TableRow> > <TableCell>`).
 * z-index plus élevé pour rester au-dessus des cellules body sticky.
 */
export const stickyActionHeadSx: SxProps<Theme> = {
    position: 'sticky',
    right: 0,
    bgcolor: 'background.paper',
    zIndex: 3,
    minWidth: 120,
    whiteSpace: 'nowrap',
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
    boxShadow: theme => theme.palette.shadow.stickyAction,
};
