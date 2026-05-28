// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button as MuiButton, type ButtonProps as MuiButtonProps, type SxProps, type Theme } from '@mui/material';

/** CTA primaire admin — référence « Ajouter une entreprise » (Stitch). */
const primaryButtonSx: SxProps<Theme> = {
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    borderRadius: 2,
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    boxShadow: theme => theme.palette.shadow.buttonLift,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
    '&:hover': {
        bgcolor: 'primary.main',
        transform: 'translateY(-4px)',
        boxShadow: theme => theme.palette.shadow.buttonLiftHover,
    },
    '&:active': {
        transform: 'scale(0.95) translateY(0)',
    },
    '&.Mui-disabled': {
        bgcolor: 'action.disabledBackground',
        color: 'action.disabled',
        boxShadow: 'none',
        transform: 'none',
    },
};

/** Bouton secondaire admin (Annuler, actions outlined). */
const secondaryButtonSx: SxProps<Theme> = {
    borderRadius: 2,
    borderColor: 'surface.outlineVariant',
    color: 'primary.main',
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    '&:hover': {
        bgcolor: 'surface.lavenderGrey',
        borderColor: 'surface.outlineVariant',
    },
};

export type ButtonAppearance = 'primary' | 'secondary';
export type ButtonProps = Omit<MuiButtonProps, 'variant' | 'color'> & {
    /** `primary` : CTA contained. `secondary` : outlined (Annuler). */
    appearance?: ButtonAppearance;
};

/**
 * Bouton admin standardisé — même grammaire visuelle que le CTA « Ajouter une entreprise ».
 */
export function Button({ appearance = 'primary', disableElevation = true, sx, ...props }: ButtonProps) {
    const isPrimary = appearance === 'primary';

    return (
        <MuiButton
            variant={isPrimary ? 'contained' : 'outlined'}
            disableElevation={isPrimary ? disableElevation : undefined}
            sx={[isPrimary ? primaryButtonSx : secondaryButtonSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
            {...props}
        />
    );
}


