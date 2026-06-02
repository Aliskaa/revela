// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

import { useDeleteCoach } from '@/hooks/admin';
import type { Coach } from '@aor/types';

export type DeleteCoachDialogProps = {
    open: boolean;
    coach: Coach | null;
    campaignCount: number;
    onClose: () => void;
    onDeleted: () => void;
};

export function DeleteCoachDialog({
    open,
    coach,
    campaignCount,
    onClose,
    onDeleted,
}: DeleteCoachDialogProps) {
    const deleteCoach = useDeleteCoach();

    if (!coach) return null;

    const handleConfirm = async () => {
        try {
            await deleteCoach.mutateAsync({ coachId: coach.id });
            onClose();
            onDeleted();
        } catch {
            // Toast émis par le hook ; on garde le dialog ouvert.
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Supprimer le coach</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Vous êtes sur le point de supprimer <strong>{coach.displayName}</strong> ({coach.username}).
                    {campaignCount > 0 ? (
                        <>
                            {' '}
                            Ses {campaignCount} campagne{campaignCount > 1 ? 's' : ''} ser
                            {campaignCount > 1 ? 'ont' : 'a'} automatiquement réaffectée
                            {campaignCount > 1 ? 's' : ''} au compte admin.
                        </>
                    ) : (
                        <> Ce coach n'a aucune campagne rattachée.</>
                    )}{' '}
                    Cette action est irréversible.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    disableElevation
                    disabled={deleteCoach.isPending}
                >
                    {deleteCoach.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
