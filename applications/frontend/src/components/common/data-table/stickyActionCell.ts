// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/**
 * Styles à appliquer sur la `<TableCell>` body de la colonne d'action (dernière à droite)
 * pour qu'elle reste visible quand le tableau scrolle horizontalement.
 *
 * Le scroll horizontal est porté par un parent `<Box sx={{ overflowX: 'auto' }}>` qui
 * englobe le `<Table>`. La sticky position est calculée par rapport à ce conteneur.
 * On force un `bgcolor` pour couvrir les cellules qui passent dessous, et on propage
 * la couleur de hover de la ligne via le sélecteur `tr:hover &`.
 *
 * Cible : Mac 13" et autres écrans dont la largeur n'absorbe pas le `minWidth` du tableau.
 */
export const stickyActionCellSx: SxProps<Theme> = {
    position: 'sticky',
    right: 0,
    bgcolor: 'background.paper',
    zIndex: 2,
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
    'tr:hover &': { bgcolor: 'action.hover' },
};

/**
 * Variante pour la cellule d'en-tête (`<TableHead> > <TableRow> > <TableCell>`).
 * z-index plus élevé pour rester au-dessus des cellules body sticky qui scrollent verticalement.
 */
export const stickyActionHeadSx: SxProps<Theme> = {
    position: 'sticky',
    right: 0,
    bgcolor: 'background.paper',
    zIndex: 3,
    borderLeft: '1px solid',
    borderLeftColor: 'divider',
};
