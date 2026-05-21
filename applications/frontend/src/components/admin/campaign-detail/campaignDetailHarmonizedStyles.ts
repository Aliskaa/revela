// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/** Styles partagés — maquette Stitch « Détail Campagne Harmonisé » (MUI, pas Tailwind). */
export const harmonizedCardSx: SxProps<Theme> = {
    borderRadius: 2,
    boxShadow: theme => theme.palette.shadow.brandPaper,
    border: '1px solid',
    borderColor: 'rgba(15, 24, 152, 0.08)',
    bgcolor: 'background.paper',
};
