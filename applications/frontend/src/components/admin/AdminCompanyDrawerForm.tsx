// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Stack, TextField, Typography } from '@mui/material';
import { z } from 'zod';

import { drawerSectionTitleSx } from '@/components/common/styles/listSurfaces';
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

const MODE = {
    create: {
        title: 'Ajouter une entreprise',
        subtitle:
            'Référencez une entreprise cliente et renseignez son contact principal pour la retrouver dans vos campagnes.',
        submitLabel: 'Ajouter l’entreprise',
    },
    edit: {
        title: 'Éditer l’entreprise',
        subtitle: 'Mettre à jour l’identité et le contact principal de l’entreprise.',
        submitLabel: 'Enregistrer',
    },
} as const;

export function AdminCompanyDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
}: AdminCompanyDrawerFormProps) {
    const { values, errors, submit, submitting, setField, dirty } = useDrawerForm({
        schema: companyFormSchema,
        defaultValues: buildDefaults(initialValues),
        open,
        onSubmit,
    });

    const copy = MODE[mode];

    return (
        <AdminDrawerForm
            open={open}
            title={copy.title}
            subtitle={copy.subtitle}
            onClose={onClose}
            onSubmit={submit}
            submitLabel={copy.submitLabel}
            isSubmitting={isSubmitting || submitting}
            dirty={dirty}
        >
            <Stack spacing={4}>
                <Box component="section">
                    <Typography component="h3" sx={drawerSectionTitleSx}>
                        Identité
                    </Typography>
                    <TextField
                        label="Nom de l’entreprise"
                        value={values.name}
                        onChange={e => setField('name', e.target.value)}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        fullWidth
                        autoFocus
                    />
                </Box>

                <Box component="section">
                    <Typography component="h3" sx={drawerSectionTitleSx}>
                        Contact principal
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Nom du contact"
                            value={values.contactName}
                            onChange={e => setField('contactName', e.target.value)}
                            error={Boolean(errors.contactName)}
                            helperText={
                                errors.contactName || 'Optionnel — affiché dans la liste des entreprises.'
                            }
                            fullWidth
                        />
                        <TextField
                            label="Email du contact"
                            type="email"
                            value={values.contactEmail}
                            onChange={e => setField('contactEmail', e.target.value)}
                            error={Boolean(errors.contactEmail)}
                            helperText={
                                errors.contactEmail || 'Optionnel — sous-titre du contact dans le tableau.'
                            }
                            fullWidth
                        />
                    </Stack>
                </Box>
            </Stack>
        </AdminDrawerForm>
    );
}
