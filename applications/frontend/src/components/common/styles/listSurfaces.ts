// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { SxProps, Theme } from '@mui/material';

/** Styles partagés des surfaces de listes admin (cartes, en-têtes de table, lignes). */
export const surfaceCardSx: SxProps<Theme> = {
    borderRadius: 2,
    boxShadow: theme => theme.palette.shadow.brandPaper,
    border: '1px solid',
    borderColor: 'tint.primaryBg',
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
    bgcolor: 'surface.lavenderGrey',
    borderBottom: 'none',
};

/** Survol et bordures de ligne harmonisés pour les tables de liste admin. */
export const listRowSx: SxProps<Theme> = {
    '&:hover': { bgcolor: 'surface.lavenderGreyHover' },
    '& td': { borderColor: 'surface.lavenderGreyHover' },
};

/** Boutons compacts des colonnes d'action dans les tableaux harmonisés. */
export const harmonizedTableActionButtonSx: SxProps<Theme> = {
    borderRadius: 2,
    fontSize: '0.6875rem',
    fontWeight: 700,
    px: 1.5,
    py: 0.625,
    minWidth: 72,
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
    textTransform: 'none',
    borderColor: 'border',
};

/** Cellule de données harmonisée (padding + alignement vertical). */
export const harmonizedTableCellSx: SxProps<Theme> = {
    py: 2,
    verticalAlign: 'middle',
};

/** Libellé de section dans les drawers admin harmonisés (Stitch : IDENTITÉ, ACCÈS…). */
export const drawerSectionTitleSx: SxProps<Theme> = {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'text.secondary',
    mb: 2,
};

/** Champs outlined du drawer Stitch (fond blanc, label uppercase flottant). */
export const drawerFormFieldSlotProps = {
    inputLabel: { shrink: true },
} as const;

export const drawerFormFieldSx: SxProps<Theme> = {
    '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        bgcolor: 'background.paper',
        '& fieldset': {
            borderColor: 'surface.outlineVariant',
        },
        '&:hover fieldset': {
            borderColor: 'surface.outlineVariant',
        },
        '&.Mui-focused': {
            boxShadow: theme => `0 0 0 2px ${theme.palette.tint.primaryFocusRing}`,
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: '1px',
        },
        '&.Mui-error fieldset': {
            borderColor: 'error.main',
        },
        '&.Mui-disabled': {
            bgcolor: 'surface.containerLow',
            opacity: 0.6,
        },
    },
    '& .MuiInputLabel-root': {
        fontSize: '0.6875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'surface.onSurfaceVariant',
        bgcolor: 'background.paper',
        px: 0.75,
        lineHeight: 1.2,
        transform: 'translate(14px, -9px) scale(1)',
        maxWidth: 'calc(133% - 32px)',
        '&.Mui-focused': {
            color: 'primary.main',
        },
        '&.Mui-error': {
            color: 'error.main',
        },
        '&.Mui-disabled': {
            color: 'text.disabled',
        },
    },
    '& .MuiFormHelperText-root': {
        fontSize: '0.6875rem',
        fontStyle: 'italic',
        color: 'text.secondary',
        opacity: 0.7,
        mt: 1,
        mx: 0.5,
    },
};
