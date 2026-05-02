// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

import { useDeleteCompany } from '@/hooks/admin';

export type DeleteCompanyDialogProps = {
    open: boolean;
    company: { id: number; name: string; participant_count: number };
    onClose: () => void;
    onDeleted: () => void;
};

export function DeleteCompanyDialog({ open, company, onClose, onDeleted }: DeleteCompanyDialogProps) {
    const deleteCompany = useDeleteCompany();

    const handleConfirm = async () => {
        await deleteCompany.mutateAsync({ companyId: company.id });
        onClose();
        onDeleted();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Supprimer l'entreprise</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Vous êtes sur le point de supprimer <strong>{company.name}</strong>. Cette action est
                    irréversible (RGPD).
                    {company.participant_count > 0 && (
                        <>
                            {' '}
                            Les <strong>{company.participant_count} participant(s)</strong> rattaché(s) seront également
                            supprimés, ainsi que toutes leurs réponses, scores et invitations. Les campagnes de
                            l'entreprise seront aussi supprimées.
                        </>
                    )}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    disableElevation
                    disabled={deleteCompany.isPending}
                >
                    {deleteCompany.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
