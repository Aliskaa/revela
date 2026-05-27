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
    /** Style aligné sur les pages admin harmonisées (Entreprises, Campagnes…). */
    harmonized?: boolean;
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
    harmonized = false,
}: AdminDrawerFormProps) {
    const { t } = useTranslation();
    const titleId = React.useId();
    const resolvedSubmitLabel = submitLabel ?? t('common.save');
    const resolvedCancelLabel = cancelLabel ?? t('common.cancel');
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const resolvedWidth = width ?? (harmonized ? 448 : 560);

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
                <Box sx={{ p: harmonized ? { xs: 2.5, sm: 3 } : 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                id={titleId}
                                variant={harmonized ? 'h5' : 'h6'}
                                fontWeight={harmonized ? 700 : 800}
                                color={harmonized ? 'primary.main' : 'text.primary'}
                                sx={
                                    harmonized
                                        ? { letterSpacing: -0.02, lineHeight: 1.2 }
                                        : undefined
                                }
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
                                        maxWidth: harmonized ? 480 : undefined,
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
                                harmonized
                                    ? {
                                          borderRadius: '50%',
                                          color: 'text.secondary',
                                          '&:hover': { bgcolor: 'surface.lavenderGrey' },
                                      }
                                    : {
                                          border: '1px solid',
                                          borderColor: 'border',
                                          borderRadius: 1,
                                      }
                            }
                        >
                            <X size={16} />
                        </IconButton>
                    </Stack>
                </Box>

                <Divider sx={harmonized ? { borderColor: 'surface.outlineVariantFaint' } : undefined} />

                <Box sx={{ flex: 1, overflowY: 'auto', p: harmonized ? 4 : 2.5 }}>{children}</Box>

                <Divider sx={harmonized ? { borderColor: 'surface.outlineVariantFaint' } : undefined} />

                <Box sx={{ p: harmonized ? 3 : 2.5 }}>
                    {harmonized ? (
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
                    ) : (
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
                                <Button appearance="secondary" onClick={requestClose}>
                                    {resolvedCancelLabel}
                                </Button>

                                {onSubmit ? (
                                    <Button
                                        appearance="primary"
                                        onClick={onSubmit}
                                        disabled={isSubmitDisabled || isSubmitting}
                                    >
                                        {isSubmitting ? t('common.saving') : resolvedSubmitLabel}
                                    </Button>
                                ) : null}
                            </Stack>
                        </Stack>
                    )}
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
