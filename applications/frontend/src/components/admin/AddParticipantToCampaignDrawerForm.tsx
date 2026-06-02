// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { z } from 'zod';

import { useDrawerForm } from '@/lib/useDrawerForm';

import { AdminDrawerForm } from './AdminDrawerForm';

const participantFormSchema = z.object({
    firstName: z.string().trim().min(1, 'Le prénom est requis.'),
    lastName: z.string().trim().min(1, 'Le nom est requis.'),
    email: z
        .string()
        .trim()
        .min(1, "L'email est requis.")
        .refine(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Email invalide.' }),
    organisation: z.string().trim(),
    direction: z.string().trim(),
    service: z.string().trim(),
    functionLevel: z.enum(['', 'direction', 'middle_management', 'frontline_manager']),
});

export type AddParticipantFormValues = z.infer<typeof participantFormSchema>;

export type ParticipantDrawerMode = 'create' | 'edit';

export type AddParticipantToCampaignDrawerFormProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: AddParticipantFormValues) => Promise<unknown> | unknown;
    isSubmitting?: boolean;
    mode?: ParticipantDrawerMode;
    /** Valeurs initiales (mode `edit` ou préremplissage en création). */
    initialValues?: Partial<AddParticipantFormValues>;
    /** Override le titre (sinon dérivé du `mode`). */
    title?: string;
    /**
     * Override le sous-titre par défaut. Permet de réutiliser le drawer depuis la fiche
     * entreprise (où il n'y a pas d'invitation immédiate) en plus du contexte campagne.
     */
    subtitle?: string;
    /** Override le libellé du bouton de soumission (défaut : « Ajouter et inviter »). */
    submitLabel?: string;
};

const MODE_COPY = {
    create: {
        title: 'Ajouter un participant',
        subtitle:
            "Le participant est rattaché à l'entreprise de la campagne et reçoit immédiatement une invitation.",
        submitLabel: 'Ajouter et inviter',
    },
    edit: {
        title: 'Modifier le participant',
        subtitle: 'Mettre à jour le profil organisationnel du collaborateur.',
        submitLabel: 'Enregistrer',
    },
} as const;

const buildDefaults = (initial?: Partial<AddParticipantFormValues>): AddParticipantFormValues => ({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    organisation: initial?.organisation ?? '',
    direction: initial?.direction ?? '',
    service: initial?.service ?? '',
    functionLevel: initial?.functionLevel ?? '',
});

export function AddParticipantToCampaignDrawerForm({
    open,
    onClose,
    onSubmit,
    isSubmitting = false,
    mode = 'create',
    initialValues,
    title,
    subtitle,
    submitLabel,
}: AddParticipantToCampaignDrawerFormProps) {
    const copy = MODE_COPY[mode];

    const { values, errors, submit, submitting, setField, dirty } = useDrawerForm({
        schema: participantFormSchema,
        defaultValues: buildDefaults(initialValues),
        open,
        onSubmit,
    });

    const identityLocked = mode === 'edit';

    return (
        <AdminDrawerForm
            open={open}
            title={title ?? copy.title}
            subtitle={subtitle ?? copy.subtitle}
            onClose={onClose}
            onSubmit={submit}
            submitLabel={submitLabel ?? copy.submitLabel}
            isSubmitting={isSubmitting || submitting}
            dirty={dirty}
        >
            <Stack spacing={2.25}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Identité
                    </Typography>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Prénom"
                                value={values.firstName}
                                onChange={e => setField('firstName', e.target.value)}
                                error={Boolean(errors.firstName)}
                                helperText={errors.firstName}
                                fullWidth
                                autoFocus={!identityLocked}
                                disabled={identityLocked}
                            />
                            <TextField
                                label="Nom"
                                value={values.lastName}
                                onChange={e => setField('lastName', e.target.value)}
                                error={Boolean(errors.lastName)}
                                helperText={errors.lastName}
                                fullWidth
                                disabled={identityLocked}
                            />
                        </Stack>
                        <TextField
                            label="Email"
                            type="email"
                            value={values.email}
                            onChange={e => setField('email', e.target.value)}
                            error={Boolean(errors.email)}
                            helperText={
                                errors.email ??
                                (identityLocked
                                    ? undefined
                                    : "Si un participant existe déjà avec cet email, il sera réutilisé et rattaché à l'entreprise de la campagne.")
                            }
                            fullWidth
                            disabled={identityLocked}
                        />
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Profil (optionnel)
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Organisation"
                            value={values.organisation}
                            onChange={e => setField('organisation', e.target.value)}
                            fullWidth
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label="Direction"
                                value={values.direction}
                                onChange={e => setField('direction', e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Service"
                                value={values.service}
                                onChange={e => setField('service', e.target.value)}
                                fullWidth
                            />
                        </Stack>
                        <FormControl fullWidth>
                            <InputLabel>Niveau de fonction</InputLabel>
                            <Select
                                label="Niveau de fonction"
                                value={values.functionLevel}
                                onChange={e =>
                                    setField('functionLevel', e.target.value as AddParticipantFormValues['functionLevel'])
                                }
                            >
                                <MenuItem value="">Non précisé</MenuItem>
                                <MenuItem value="direction">Direction</MenuItem>
                                <MenuItem value="middle_management">Middle management</MenuItem>
                                <MenuItem value="frontline_manager">Frontline manager</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Box>
            </Stack>
        </AdminDrawerForm>
    );
}
