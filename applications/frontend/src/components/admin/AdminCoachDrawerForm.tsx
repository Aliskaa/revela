// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { z } from 'zod';

import { useDrawerForm } from '@/lib/useDrawerForm';

import { AdminDrawerForm } from './AdminDrawerForm';

export type CoachDrawerMode = 'create' | 'edit';

/**
 * Schéma aligné sur l'API `POST /admin/coaches` qui exige `{ username, password, displayName }`.
 * Les anciens champs décoratifs (firstName/lastName, organisation, status, notes…) ont été retirés :
 * ils n'étaient pas envoyés au backend et le mot de passe était hardcodé à `'changeme123'` côté
 * route, ce qui était un trou de sécurité évident.
 */
const coachFormSchema = z.object({
    displayName: z.string().trim().min(1, 'Le nom à afficher est requis.'),
    username: z.string().trim().min(3, 'Le username doit contenir au moins 3 caractères.'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
});

export type CoachFormValues = z.infer<typeof coachFormSchema>;

export type AdminCoachDrawerFormProps = {
    open: boolean;
    mode: CoachDrawerMode;
    initialValues?: Partial<CoachFormValues>;
    onClose: () => void;
    onSubmit: (values: CoachFormValues) => Promise<unknown> | unknown;
    isSubmitting?: boolean;
};

const buildDefaults = (initial?: Partial<CoachFormValues>): CoachFormValues => ({
    displayName: initial?.displayName ?? '',
    username: initial?.username ?? '',
    password: initial?.password ?? '',
});

export function AdminCoachDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
}: AdminCoachDrawerFormProps) {
    const { values, errors, submit, submitting, setField } = useDrawerForm({
        schema: coachFormSchema,
        defaultValues: buildDefaults(initialValues),
        open,
        onSubmit,
    });

    const [showPassword, setShowPassword] = React.useState(false);

    const title = mode === 'create' ? 'Nouveau coach' : 'Éditer le coach';
    const subtitle =
        mode === 'create' ? 'Créer un coach et lui attribuer un accès.' : 'Mettre à jour le profil du coach.';

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
                            label="Nom à afficher"
                            value={values.displayName}
                            onChange={e => setField('displayName', e.target.value)}
                            error={Boolean(errors.displayName)}
                            helperText={errors.displayName}
                            fullWidth
                            autoFocus
                        />
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Accès
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Username"
                            value={values.username}
                            onChange={e => setField('username', e.target.value)}
                            error={Boolean(errors.username)}
                            helperText={errors.username ?? 'Identifiant utilisé pour se connecter.'}
                            fullWidth
                        />
                        <TextField
                            label="Mot de passe initial"
                            type={showPassword ? 'text' : 'password'}
                            value={values.password}
                            onChange={e => setField('password', e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={errors.password ?? 'Sera communiqué au coach pour sa première connexion.'}
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => setShowPassword(s => !s)}
                                                aria-label={
                                                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                                                }
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>
                </Box>
            </Stack>
        </AdminDrawerForm>
    );
}
