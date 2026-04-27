import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export type AdminDrawerFormProps = {
    open: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    onSubmit?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    children: React.ReactNode;
    width?: number | string;
    footerLeft?: React.ReactNode;
    footerRight?: React.ReactNode;
    isSubmitDisabled?: boolean;
    isSubmitting?: boolean;
    /**
     * Si `true`, fermer le drawer (clic extérieur, X, Annuler) ouvre un dialog de confirmation
     * pour éviter de perdre les modifications en cours. Typiquement câblé sur `dirty` retourné
     * par `useDrawerForm`.
     */
    dirty?: boolean;
};

export function AdminDrawerForm({
    open,
    title,
    subtitle,
    onClose,
    onSubmit,
    submitLabel,
    cancelLabel,
    children,
    width = 560,
    footerLeft,
    footerRight,
    isSubmitDisabled = false,
    isSubmitting = false,
    dirty = false,
}: AdminDrawerFormProps) {
    const { t } = useTranslation();
    const titleId = React.useId();
    const resolvedSubmitLabel = submitLabel ?? t('common.save');
    const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const requestClose = React.useCallback(() => {
        if (dirty) {
            setConfirmOpen(true);
            return;
        }
        onClose();
    }, [dirty, onClose]);

    const handleConfirmDiscard = () => {
        setConfirmOpen(false);
        onClose();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={requestClose}
            slotProps={{
                paper: {
                    sx: {
                        width: { xs: '100vw', sm: width },
                        maxWidth: '100vw',
                        bgcolor: 'background.paper',
                    },
                    'aria-labelledby': titleId,
                },
            }}
        >
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography id={titleId} variant="h6" fontWeight={800} color="text.primary">
                                {title}
                            </Typography>
                            {subtitle ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                                    {subtitle}
                                </Typography>
                            ) : null}
                        </Box>

                        <IconButton
                            onClick={requestClose}
                            aria-label={t('drawer.closePanel')}
                            sx={{ border: '1px solid rgba(15,23,42,0.10)' }}
                        >
                            <X size={16} />
                        </IconButton>
                    </Stack>
                </Box>

                <Divider />

                <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>{children}</Box>

                <Divider />

                <Box sx={{ p: 2.5 }}>
                    <Stack
                        direction="row"
                        spacing={1.2}
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                    >
                        <Box>{footerLeft}</Box>

                        <Stack direction="row" spacing={1.2} sx={{ ml: 'auto' }}>
                            {footerRight}
                            <Button onClick={requestClose} variant="outlined" sx={{ borderRadius: 3 }}>
                                {resolvedCancelLabel}
                            </Button>

                            {onSubmit ? (
                                <Button
                                    onClick={onSubmit}
                                    variant="contained"
                                    disableElevation
                                    disabled={isSubmitDisabled || isSubmitting}
                                    sx={{ borderRadius: 3 }}
                                >
                                    {isSubmitting ? t('common.saving') : resolvedSubmitLabel}
                                </Button>
                            ) : null}
                        </Stack>
                    </Stack>
                </Box>
            </Box>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Abandonner les modifications ?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous avez des modifications non enregistrées. Si vous fermez le panneau, elles seront perdues.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Continuer la saisie</Button>
                    <Button onClick={handleConfirmDiscard} color="error" variant="contained" disableElevation>
                        Abandonner
                    </Button>
                </DialogActions>
            </Dialog>
        </Drawer>
    );
}
