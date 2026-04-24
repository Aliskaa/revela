import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { X } from 'lucide-react';
import type * as React from 'react';

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
};

export function AdminDrawerForm({
    open,
    title,
    subtitle,
    onClose,
    onSubmit,
    submitLabel = 'Enregistrer',
    cancelLabel = 'Annuler',
    children,
    width = 560,
    footerLeft,
    footerRight,
    isSubmitDisabled = false,
    isSubmitting = false,
}: AdminDrawerFormProps) {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100vw', sm: width },
                    maxWidth: '100vw',
                    bgcolor: '#fff',
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
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {title}
                            </Typography>
                            {subtitle ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                                    {subtitle}
                                </Typography>
                            ) : null}
                        </Box>

                        <IconButton
                            onClick={onClose}
                            aria-label="Fermer le panneau"
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
                            <Button
                                onClick={onClose}
                                variant="outlined"
                                sx={{ borderRadius: 3, textTransform: 'none' }}
                            >
                                {cancelLabel}
                            </Button>

                            {onSubmit ? (
                                <Button
                                    onClick={onSubmit}
                                    variant="contained"
                                    disableElevation
                                    disabled={isSubmitDisabled || isSubmitting}
                                    sx={{ borderRadius: 3, textTransform: 'none' }}
                                >
                                    {isSubmitting ? 'Enregistrement…' : submitLabel}
                                </Button>
                            ) : null}
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
}

/*
Usage:

<AdminDrawerForm
  open={open}
  title="Nouvelle campagne"
  subtitle="Créer une campagne et l’assigner à un questionnaire"
  onClose={() => setOpen(false)}
  onSubmit={handleSubmit}
>
  <Stack spacing={2}>
    ...form fields...
  </Stack>
</AdminDrawerForm>
*/
