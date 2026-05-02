// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

import { useDeleteParticipant } from '@/hooks/admin';
import type { Participant } from '@aor/types';

export type DeleteCompanyParticipantDialogProps = {
    participant: Participant | null;
    onClose: () => void;
    onDeleted: (snackMessage: string) => void;
};

export function DeleteCompanyParticipantDialog({
    participant,
    onClose,
    onDeleted,
}: DeleteCompanyParticipantDialogProps) {
    const deleteParticipant = useDeleteParticipant();

    const handleConfirm = async () => {
        if (!participant) return;
        const result = await deleteParticipant.mutateAsync({ participantId: participant.id });
        const responsesLabel = result.responses_removed !== 1 ? 's' : '';
        const tokensLabel = result.invite_tokens_removed !== 1 ? 's' : '';
        onDeleted(
            `${participant.full_name} supprimé (${result.responses_removed} réponse${responsesLabel}, ${result.invite_tokens_removed} invitation${tokensLabel} retirées)`
        );
        onClose();
    };

    return (
        <Dialog open={participant !== null} onClose={onClose}>
            <DialogTitle>Supprimer le participant</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Vous êtes sur le point de supprimer <strong>{participant?.full_name}</strong> ({participant?.email}
                    ). Toutes ses réponses, scores et invitations seront définitivement effacés (RGPD).
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    disableElevation
                    disabled={deleteParticipant.isPending}
                >
                    {deleteParticipant.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
