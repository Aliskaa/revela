// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/** Styles partagés des surfaces de listes admin (cartes, en-têtes de table, lignes). */
export const LAVENDER_GREY = '#F5F5FB';

export const surfaceCardSx: SxProps<Theme> = {
    borderRadius: 2,
    boxShadow: theme => theme.palette.shadow.brandPaper,
    border: '1px solid',
    borderColor: 'rgba(15, 24, 152, 0.08)',
    bgcolor: 'background.paper',
};

export const listPanelSurfaceSx: SxProps<Theme> = {
    ...surfaceCardSx,
    borderRadius: 4,
    boxShadow: theme => theme.palette.shadow.brandSubtle,
    overflow: 'hidden',
};

export const listTableHeadCellSx: SxProps<Theme> = {
    py: 2,
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'text.secondary',
    bgcolor: LAVENDER_GREY,
    borderBottom: 'none',
};

/** Survol et bordures de ligne harmonisés pour les tables de liste admin. */
export const listRowSx: SxProps<Theme> = {
    '&:hover': { bgcolor: 'rgba(245, 245, 251, 0.8)' },
    '& td': { borderColor: 'rgba(245, 245, 251, 0.8)' },
};
