// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, FormControlLabel, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { z } from 'zod';

import { drawerFormFieldSlotProps, drawerFormFieldSx, drawerSectionTitleSx } from '@/components/common/styles/listSurfaces';
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
    /**
     * Verrouille certains champs (rendus en lecture seule). Utilisé pour la ligne sentinelle
     * « Admin » dont seul le `displayName` est modifiable depuis l'UI.
     */
    lockedFields?: {
        username?: boolean;
        password?: boolean;
        isActive?: boolean;
    };
};

const buildDefaults = (initial?: Partial<CoachFormValues>): CoachFormValues => ({
    displayName: initial?.displayName ?? '',
    username: initial?.username ?? '',
    password: '',
    isActive: initial?.isActive ?? true,
});

const COPY = {
    create: {
        title: 'Nouveau coach',
        subtitle: 'Créer un coach et lui attribuer un accès.',
        submitLabel: 'Créer',
    },
    edit: {
        title: 'Éditer le coach',
        subtitle: 'Mettre à jour le profil du coach.',
        submitLabel: 'Enregistrer',
    },
} as const;

export function AdminCoachDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
    lockedFields,
}: AdminCoachDrawerFormProps) {
    const schema = React.useMemo(() => buildCoachSchema(mode), [mode]);
    const defaults = React.useMemo(() => buildDefaults(initialValues), [initialValues]);

    const usernameLocked = lockedFields?.username ?? false;
    const passwordLocked = lockedFields?.password ?? false;
    const isActiveLocked = lockedFields?.isActive ?? false;

    const { values, errors, submit, submitting, setField, dirty } = useDrawerForm({
        schema,
        defaultValues: defaults,
        open,
        onSubmit,
    });

    const [showPassword, setShowPassword] = React.useState(false);
    const copy = COPY[mode];

    return (
        <AdminDrawerForm
            open={open}
            harmonized
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
                        label="Nom à afficher"
                        value={values.displayName}
                        onChange={e => setField('displayName', e.target.value)}
                        error={Boolean(errors.displayName)}
                        helperText={errors.displayName}
                        fullWidth
                        autoFocus
                        slotProps={drawerFormFieldSlotProps}
                        sx={drawerFormFieldSx}
                    />
                </Box>

                <Box component="section">
                    <Typography component="h3" sx={drawerSectionTitleSx}>
                        Accès
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Username"
                            value={values.username}
                            onChange={e => setField('username', e.target.value)}
                            error={Boolean(errors.username)}
                            helperText={
                                errors.username ??
                                (usernameLocked
                                    ? 'Verrouillé pour le compte admin (défini par ADMIN_USERNAME).'
                                    : 'Identifiant utilisé pour se connecter.')
                            }
                            fullWidth
                            disabled={usernameLocked}
                            slotProps={drawerFormFieldSlotProps}
                            sx={drawerFormFieldSx}
                        />
                        <TextField
                            label={mode === 'create' ? 'Mot de passe initial' : 'Nouveau mot de passe (optionnel)'}
                            type={showPassword ? 'text' : 'password'}
                            value={values.password}
                            onChange={e => setField('password', e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={
                                errors.password ??
                                (passwordLocked
                                    ? "Verrouillé pour le compte admin (auth via variables d'environnement)."
                                    : mode === 'create'
                                      ? 'Sera communiqué au coach pour sa première connexion.'
                                      : 'Laisser vide pour conserver le mot de passe actuel.')
                            }
                            fullWidth
                            disabled={passwordLocked}
                            sx={drawerFormFieldSx}
                            slotProps={{
                                ...drawerFormFieldSlotProps,
                                input: {
                                    endAdornment: passwordLocked ? null : (
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
                    <Box component="section">
                        <Typography component="h3" sx={drawerSectionTitleSx}>
                            Statut
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={values.isActive}
                                    onChange={(_, checked) => setField('isActive', checked)}
                                    disabled={isActiveLocked}
                                    sx={{
                                        '& .MuiSwitch-track': {
                                            bgcolor: 'surface.lavenderGrey',
                                            opacity: 1,
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            bgcolor: 'tint.primarySwitchTrack',
                                            opacity: 1,
                                        },
                                    }}
                                />
                            }
                            label={
                                <Typography variant="body2" color="text.secondary">
                                    {values.isActive ? 'Coach actif' : 'Coach désactivé'}
                                </Typography>
                            }
                            sx={{ m: 0, px: 0.5, py: 0.5 }}
                        />
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 1, mx: 0.5, fontStyle: 'italic', opacity: 0.7 }}
                        >
                            {isActiveLocked
                                ? 'Le compte admin reste toujours actif.'
                                : 'Un coach désactivé conserve ses campagnes mais ne peut plus se connecter.'}
                        </Typography>
                    </Box>
                )}
            </Stack>
        </AdminDrawerForm>
    );
}
