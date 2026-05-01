// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, FormControlLabel, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { z } from 'zod';

import { useDrawerForm } from '@/lib/useDrawerForm';

import { AdminDrawerForm } from './AdminDrawerForm';

export type CoachDrawerMode = 'create' | 'edit';

/**
 * Schéma aligné sur l'API `POST /admin/coaches` qui exige `{ username, password, displayName }`
 * et `PATCH /admin/coaches/:id` qui accepte `{ username?, password?, display_name?, is_active? }`.
 *
 * En mode `edit`, le mot de passe est optionnel : un champ vide signifie "ne pas changer".
 */
const buildCoachSchema = (mode: CoachDrawerMode) =>
    z.object({
        displayName: z.string().trim().min(1, 'Le nom à afficher est requis.'),
        username: z.string().trim().min(3, 'Le username doit contenir au moins 3 caractères.'),
        password:
            mode === 'create'
                ? z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
                : z
                      .string()
                      .refine(
                          v => v === '' || v.length >= 8,
                          'Au moins 8 caractères, ou laisser vide pour conserver le mot de passe actuel.'
                      ),
        isActive: z.boolean(),
    });

export type CoachFormValues = z.infer<ReturnType<typeof buildCoachSchema>>;

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
    password: '',
    isActive: initial?.isActive ?? true,
});

export function AdminCoachDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
}: AdminCoachDrawerFormProps) {
    const schema = React.useMemo(() => buildCoachSchema(mode), [mode]);
    const defaults = React.useMemo(() => buildDefaults(initialValues), [initialValues]);

    const { values, errors, submit, submitting, setField, dirty } = useDrawerForm({
        schema,
        defaultValues: defaults,
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
            dirty={dirty}
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
                            label={mode === 'create' ? 'Mot de passe initial' : 'Nouveau mot de passe (optionnel)'}
                            type={showPassword ? 'text' : 'password'}
                            value={values.password}
                            onChange={e => setField('password', e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={
                                errors.password ??
                                (mode === 'create'
                                    ? 'Sera communiqué au coach pour sa première connexion.'
                                    : 'Laisser vide pour conserver le mot de passe actuel.')
                            }
                            fullWidth
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => setShowPassword(s => !s)}
                                                aria-label={
                                                    showPassword
                                                        ? 'Masquer le mot de passe'
                                                        : 'Afficher le mot de passe'
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

                {mode === 'edit' && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Statut
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={values.isActive}
                                    onChange={(_, checked) => setField('isActive', checked)}
                                />
                            }
                            label={values.isActive ? 'Coach actif' : 'Coach désactivé'}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Un coach désactivé conserve ses campagnes mais ne peut plus se connecter.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </AdminDrawerForm>
    );
}
