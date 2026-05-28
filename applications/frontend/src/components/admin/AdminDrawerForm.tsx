import {
    Box,
    Button as MuiButton,
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

import { Button } from '@/components/common/Button';

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
    width,
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
    const resolvedWidth = width ?? 448;

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
                        width: { xs: '100vw', sm: resolvedWidth },
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
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                id={titleId}
                                variant={'h5'}
                                fontWeight={700}
                                color={'primary.main'}
                                sx={{ letterSpacing: -0.02, lineHeight: 1.2 }}
                            >
                                {title}
                            </Typography>
                            {subtitle ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 0.75,
                                        lineHeight: 1.7,
                                        maxWidth: 480,
                                    }}
                                >
                                    {subtitle}
                                </Typography>
                            ) : null}
                        </Box>

                        <IconButton
                            onClick={requestClose}
                            aria-label={t('drawer.closePanel')}
                            sx={
                                {
                                    borderRadius: '50%',
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: 'surface.lavenderGrey' },
                                }
                            }
                        >
                            <X size={16} />
                        </IconButton>
                    </Stack>
                </Box>

                <Divider sx={{ borderColor: 'surface.outlineVariantFaint' }} />

                <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>{children}</Box>

                <Divider sx={{ borderColor: 'surface.outlineVariantFaint' }} />

                <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        {footerLeft}
                        <Button appearance="secondary" onClick={requestClose} sx={{ flex: 1, py: 1.5 }}>
                            {resolvedCancelLabel}
                        </Button>
                        {onSubmit ? (
                            <Button
                                appearance="primary"
                                onClick={onSubmit}
                                disabled={isSubmitDisabled || isSubmitting}
                                sx={{ flex: 1, py: 1.5 }}
                            >
                                {isSubmitting ? t('common.saving') : resolvedSubmitLabel}
                            </Button>
                        ) : null}
                        {footerRight}
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
                    <MuiButton onClick={() => setConfirmOpen(false)}>Continuer la saisie</MuiButton>
                    <MuiButton onClick={handleConfirmDiscard} color="error" variant="contained" disableElevation>
                        Abandonner
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </Drawer>
    );
}
