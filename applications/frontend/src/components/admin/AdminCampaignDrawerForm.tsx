// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { z } from 'zod';

import { useCoaches, useCompanies } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import { useDrawerForm } from '@/lib/useDrawerForm';

import { AdminDrawerForm } from './AdminDrawerForm';

export type CampaignDrawerMode = 'create' | 'edit';

const campaignFormSchema = z
    .object({
        name: z.string().trim().min(3, 'Le nom doit contenir au moins 3 caractères.'),
        companyId: z.number().int().positive("L'entreprise est requise."),
        coachId: z.number().int().positive('Le coach est requis.'),
        questionnaireId: z.string().trim().min(1, 'Le questionnaire est requis.'),
        startDate: z.string().trim(),
        endDate: z.string().trim(),
        status: z.enum(['draft', 'active', 'closed', 'archived']),
        allowTestWithoutManualInputs: z.boolean(),
    })
    .refine(
        data => {
            if (data.startDate.length === 0 || data.endDate.length === 0) {
                return true;
            }
            return new Date(data.startDate) <= new Date(data.endDate);
        },
        {
            message: 'La date de fin doit être postérieure à la date de début.',
            path: ['endDate'],
        }
    );

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export type AdminCampaignDrawerFormProps = {
    open: boolean;
    mode: CampaignDrawerMode;
    initialValues?: Partial<CampaignFormValues>;
    onClose: () => void;
    onSubmit: (values: CampaignFormValues) => void | Promise<void>;
    isSubmitting?: boolean;
    error?: string | null;
};

const buildDefaults = (initial?: Partial<CampaignFormValues>): CampaignFormValues => ({
    name: initial?.name ?? '',
    companyId: initial?.companyId ?? 0,
    coachId: initial?.coachId ?? 0,
    questionnaireId: initial?.questionnaireId ?? '',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    status: initial?.status ?? 'draft',
    allowTestWithoutManualInputs: initial?.allowTestWithoutManualInputs ?? false,
});

export function AdminCampaignDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
    error = null,
}: AdminCampaignDrawerFormProps) {
    const { data: companies = [] } = useCompanies();
    const { data: coaches = [] } = useCoaches();
    const { data: questionnaires = [] } = useAdminQuestionnaires();

    const { values, errors, submit, submitting, setField } = useDrawerForm({
        schema: campaignFormSchema,
        defaultValues: buildDefaults(initialValues),
        open,
        onSubmit,
    });

    const title = mode === 'create' ? 'Nouvelle campagne' : 'Éditer la campagne';
    const subtitle =
        mode === 'create'
            ? 'Créer une campagne et lui associer un questionnaire.'
            : 'Mettre à jour les informations de la campagne.';

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
                    <TextField
                        label="Nom de la campagne"
                        value={values.name}
                        onChange={e => setField('name', e.target.value)}
                        error={Boolean(errors.name)}
                        helperText={errors.name}
                        fullWidth
                        autoFocus
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Affectation
                    </Typography>
                    <Stack spacing={2}>
                        <FormControl fullWidth error={Boolean(errors.companyId)}>
                            <InputLabel>Entreprise</InputLabel>
                            <Select
                                label="Entreprise"
                                value={values.companyId === 0 ? '' : values.companyId}
                                onChange={e => setField('companyId', Number(e.target.value) || 0)}
                            >
                                {companies.map(company => (
                                    <MenuItem key={company.id} value={company.id}>
                                        {company.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.companyId ? <FormHelperText>{errors.companyId}</FormHelperText> : null}
                        </FormControl>

                        <FormControl fullWidth error={Boolean(errors.coachId)}>
                            <InputLabel>Coach</InputLabel>
                            <Select
                                label="Coach"
                                value={values.coachId === 0 ? '' : values.coachId}
                                onChange={e => setField('coachId', Number(e.target.value) || 0)}
                            >
                                {coaches.map(coach => (
                                    <MenuItem key={coach.id} value={coach.id}>
                                        {coach.displayName}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.coachId ? <FormHelperText>{errors.coachId}</FormHelperText> : null}
                        </FormControl>

                        <FormControl fullWidth error={Boolean(errors.questionnaireId)}>
                            <InputLabel>Questionnaire</InputLabel>
                            <Select
                                label="Questionnaire"
                                value={values.questionnaireId}
                                onChange={e => setField('questionnaireId', e.target.value)}
                            >
                                {questionnaires.map(q => (
                                    <MenuItem key={q.id} value={q.id}>
                                        {q.id} — {q.title}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.questionnaireId ? (
                                <FormHelperText>{errors.questionnaireId}</FormHelperText>
                            ) : null}
                        </FormControl>
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Dates et statut
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Date de début"
                            type="date"
                            value={values.startDate}
                            onChange={e => setField('startDate', e.target.value)}
                            error={Boolean(errors.startDate)}
                            helperText={errors.startDate}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                        />
                        <TextField
                            label="Date de fin"
                            type="date"
                            value={values.endDate}
                            onChange={e => setField('endDate', e.target.value)}
                            error={Boolean(errors.endDate)}
                            helperText={errors.endDate}
                            slotProps={{ inputLabel: { shrink: true } }}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Statut initial</InputLabel>
                            <Select
                                label="Statut initial"
                                value={values.status}
                                onChange={e => setField('status', e.target.value as CampaignFormValues['status'])}
                            >
                                <MenuItem value="draft">Brouillon</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="closed">Clôturée</MenuItem>
                                <MenuItem value="archived">Archivée</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Box>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={values.allowTestWithoutManualInputs}
                            onChange={(_, checked) => setField('allowTestWithoutManualInputs', checked)}
                        />
                    }
                    label="Autoriser le test sans inputs manuels"
                />

                {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
        </AdminDrawerForm>
    );
}
