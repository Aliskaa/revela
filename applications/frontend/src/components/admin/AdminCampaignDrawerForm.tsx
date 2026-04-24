import { useCoaches, useCompanies } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import {
    Alert,
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import * as React from 'react';
import { AdminDrawerForm } from './AdminDrawerForm';

export type CampaignDrawerMode = 'create' | 'edit';

export type CampaignFormValues = {
    name: string;
    companyId: number | '';
    coachId: number | '';
    questionnaireId: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'closed' | 'archived';
    allowTestWithoutManualInputs: boolean;
};

export type AdminCampaignDrawerFormProps = {
    open: boolean;
    mode: CampaignDrawerMode;
    initialValues?: Partial<CampaignFormValues>;
    onClose: () => void;
    onSubmit: (values: CampaignFormValues) => void | Promise<void>;
    isSubmitting?: boolean;
    error?: string | null;
};

const defaultValues: CampaignFormValues = {
    name: '',
    companyId: '',
    coachId: '',
    questionnaireId: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    allowTestWithoutManualInputs: false,
};

export function AdminCampaignDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
    error = null,
}: AdminCampaignDrawerFormProps) {
    const [values, setValues] = React.useState<CampaignFormValues>({
        ...defaultValues,
        ...initialValues,
    });

    const { data: companies = [] } = useCompanies();
    const { data: coaches = [] } = useCoaches();
    const { data: questionnaires = [] } = useAdminQuestionnaires();

    React.useEffect(() => {
        if (open) {
            setValues({ ...defaultValues, ...initialValues });
        }
    }, [open, initialValues]);

    const handleChange = <K extends keyof CampaignFormValues>(key: K, value: CampaignFormValues[K]) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const isValid =
        values.name.trim().length >= 3 &&
        values.companyId !== '' &&
        values.coachId !== '' &&
        values.questionnaireId !== '';

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
            onSubmit={() => onSubmit(values)}
            submitLabel={mode === 'create' ? 'Créer' : 'Enregistrer'}
            isSubmitting={isSubmitting}
            isSubmitDisabled={!isValid}
        >
            <Stack spacing={2.25}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Identité
                    </Typography>
                    <TextField
                        label="Nom de la campagne"
                        value={values.name}
                        onChange={e => handleChange('name', e.target.value)}
                        fullWidth
                        required
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Affectation
                    </Typography>
                    <Stack spacing={2}>
                        <FormControl fullWidth required>
                            <InputLabel>Entreprise</InputLabel>
                            <Select
                                label="Entreprise"
                                value={values.companyId}
                                onChange={e => handleChange('companyId', e.target.value as number | '')}
                            >
                                {companies.map(company => (
                                    <MenuItem key={company.id} value={company.id}>
                                        {company.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Coach</InputLabel>
                            <Select
                                label="Coach"
                                value={values.coachId}
                                onChange={e => handleChange('coachId', e.target.value as number | '')}
                            >
                                {coaches.map(coach => (
                                    <MenuItem key={coach.id} value={coach.id}>
                                        {coach.displayName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Questionnaire</InputLabel>
                            <Select
                                label="Questionnaire"
                                value={values.questionnaireId}
                                onChange={e => handleChange('questionnaireId', e.target.value)}
                            >
                                {questionnaires.map(q => (
                                    <MenuItem key={q.id} value={q.id}>
                                        {q.id} — {q.title}
                                    </MenuItem>
                                ))}
                            </Select>
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
                            onChange={e => handleChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Date de fin"
                            type="date"
                            value={values.endDate}
                            onChange={e => handleChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Statut initial</InputLabel>
                            <Select
                                label="Statut initial"
                                value={values.status}
                                onChange={e => handleChange('status', e.target.value as CampaignFormValues['status'])}
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
                            onChange={(_, checked) => handleChange('allowTestWithoutManualInputs', checked)}
                        />
                    }
                    label="Autoriser le test sans inputs manuels"
                />

                {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
        </AdminDrawerForm>
    );
}
