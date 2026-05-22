// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/** Styles partagés — maquettes Stitch harmonisées admin (MUI, pas Tailwind). */
export const HARMONIZED_LAVENDER_GREY = '#F5F5FB';

export const harmonizedCardSx: SxProps<Theme> = {
    borderRadius: 2,
    boxShadow: theme => theme.palette.shadow.brandPaper,
    border: '1px solid',
    borderColor: 'rgba(15, 24, 152, 0.08)',
    bgcolor: 'background.paper',
};

export const harmonizedListPanelSx: SxProps<Theme> = {
    ...harmonizedCardSx,
    borderRadius: 4,
    boxShadow: theme => theme.palette.shadow.brandSubtle,
    overflow: 'hidden',
};

export const harmonizedListTableHeadCellSx: SxProps<Theme> = {
    py: 2,
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'text.secondary',
    bgcolor: HARMONIZED_LAVENDER_GREY,
    borderBottom: 'none',
};
