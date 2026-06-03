// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import type * as React from 'react';

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    /** Corps du message. Une `string` est enrobée dans un `DialogContentText`. */
    description: React.ReactNode;
    /** Libellé du bouton de confirmation au repos. Défaut : « Confirmer ». */
    confirmLabel?: string;
    /** Libellé du bouton de confirmation pendant l'appel réseau. Défaut : « Confirmation… ». */
    confirmingLabel?: string;
    /** Libellé du bouton d'annulation. Défaut : « Annuler ». */
    cancelLabel?: string;
    /** Couleur du bouton de confirmation. Utiliser `error` pour les actions destructrices. */
    confirmColor?: 'primary' | 'error';
    /** Icône optionnelle affichée à gauche du libellé de confirmation. */
    confirmIcon?: React.ReactNode;
    /** `true` pendant l'appel réseau : désactive les boutons et affiche `confirmingLabel`. */
    pending?: boolean;
    /** Déclenché par le bouton de confirmation. */
    onConfirm: () => void;
    /** Déclenché par « Annuler » ou la fermeture du dialog. */
    onClose: () => void;
};

/**
 * Pop-up de confirmation réutilisable : titre + message + boutons Annuler/Confirmer.
 * Factorise le pattern dupliqué dans les dialogs de suppression (cf. DeleteCoachDialog,
 * DeleteCompanyDialog…) et les confirmations d'action irréversible (fin de feedbacks pairs).
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirmer',
    confirmingLabel = 'Confirmation…',
    cancelLabel = 'Annuler',
    confirmColor = 'primary',
    confirmIcon,
    pending = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {typeof description === 'string' ? (
                    <DialogContentText>{description}</DialogContentText>
                ) : (
                    description
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={pending}>
                    {cancelLabel}
                </Button>
                <Button
                    variant="contained"
                    color={confirmColor}
                    disableElevation
                    startIcon={confirmIcon}
                    onClick={onConfirm}
                    disabled={pending}
                >
                    {pending ? confirmingLabel : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
