// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Stack, TextField, Typography } from '@mui/material';
import { z } from 'zod';

import { useDrawerForm } from '@/lib/useDrawerForm';

import { AdminDrawerForm } from './AdminDrawerForm';

export type CompanyDrawerMode = 'create' | 'edit';

/**
 * Schéma aligné sur l'API `POST /admin/companies` et `PATCH /admin/companies/:id`.
 * Les anciens champs décoratifs (campaignCount, status, notes…) ont été retirés : ils
 * n'étaient pas envoyés au backend et créaient de la confusion côté admin.
 */
const companyFormSchema = z.object({
    name: z.string().trim().min(1, "Le nom de l'entreprise est requis."),
    contactName: z.string().trim(),
    contactEmail: z
        .string()
        .trim()
        .refine(v => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
            message: 'Email du contact invalide.',
        }),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export type AdminCompanyDrawerFormProps = {
    open: boolean;
    mode: CompanyDrawerMode;
    initialValues?: Partial<CompanyFormValues>;
    onClose: () => void;
    onSubmit: (values: CompanyFormValues) => Promise<unknown> | unknown;
    isSubmitting?: boolean;
};

const buildDefaults = (initial?: Partial<CompanyFormValues>): CompanyFormValues => ({
    name: initial?.name ?? '',
    contactName: initial?.contactName ?? '',
    contactEmail: initial?.contactEmail ?? '',
});

export function AdminCompanyDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
}: AdminCompanyDrawerFormProps) {
    const { values, errors, submit, submitting, setField } = useDrawerForm({
        schema: companyFormSchema,
        defaultValues: buildDefaults(initialValues),
        open,
        onSubmit,
    });

    const title = mode === 'create' ? 'Nouvelle entreprise' : 'Éditer l’entreprise';
    const subtitle =
        mode === 'create'
            ? 'Créer une entreprise et la relier à ses campagnes.'
            : 'Mettre à jour les informations de l’entreprise.';

    return (
        <AdminDrawerForm
            open={open}
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            onSubmit={submit}
            submitLabel={mode === 'create' ? 'Créer' : 'Enregistrer'}
            isSubmitting={isSubmitting || submitting}
        >
            <Stack spacing={2.25}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Identité
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Nom de l’entreprise"
                            value={values.name}
                            onChange={e => setField('name', e.target.value)}
                            error={Boolean(errors.name)}
                            helperText={errors.name}
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Contact principal (optionnel)"
                            value={values.contactName}
                            onChange={e => setField('contactName', e.target.value)}
                            error={Boolean(errors.contactName)}
                            helperText={errors.contactName}
                            fullWidth
                        />
                        <TextField
                            label="Email du contact (optionnel)"
                            type="email"
                            value={values.contactEmail}
                            onChange={e => setField('contactEmail', e.target.value)}
                            error={Boolean(errors.contactEmail)}
                            helperText={errors.contactEmail}
                            fullWidth
                        />
                    </Stack>
                </Box>
            </Stack>
        </AdminDrawerForm>
    );
}
