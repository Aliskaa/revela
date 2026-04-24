import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import * as React from 'react';
import { AdminDrawerForm } from './AdminDrawerForm';

export type ParticipantDrawerMode = 'create' | 'edit';

export type ParticipantFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    campaign: string;
    coach: string;
    status: 'pending' | 'active' | 'archived';
};

export type AdminParticipantDrawerFormProps = {
    open: boolean;
    mode: ParticipantDrawerMode;
    initialValues?: Partial<ParticipantFormValues>;
    onClose: () => void;
    onSubmit: (values: ParticipantFormValues) => void;
    isSubmitting?: boolean;
};

const defaultValues: ParticipantFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    campaign: '',
    coach: '',
    status: 'pending',
};

export function AdminParticipantDrawerForm({
    open,
    mode,
    initialValues,
    onClose,
    onSubmit,
    isSubmitting = false,
}: AdminParticipantDrawerFormProps) {
    const [values, setValues] = React.useState<ParticipantFormValues>({
        ...defaultValues,
        ...initialValues,
    });

    React.useEffect(() => {
        if (open) {
            setValues({
                ...defaultValues,
                ...initialValues,
            });
        }
    }, [open, initialValues]);

    const title = mode === 'create' ? 'Nouveau participant' : 'Éditer le participant';
    const subtitle =
        mode === 'create'
            ? 'Créer un participant et le rattacher à une campagne.'
            : 'Mettre à jour les informations du participant.';

    const handleChange = <K extends keyof ParticipantFormValues>(key: K, value: ParticipantFormValues[K]) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = () => onSubmit(values);

    return (
        <AdminDrawerForm
            open={open}
            title={title}
            subtitle={subtitle}
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={mode === 'create' ? 'Créer' : 'Enregistrer'}
            isSubmitting={isSubmitting}
        >
            <Stack spacing={2.25}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Identité
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Prénom"
                            value={values.firstName}
                            onChange={e => handleChange('firstName', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Nom"
                            value={values.lastName}
                            onChange={e => handleChange('lastName', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            value={values.email}
                            onChange={e => handleChange('email', e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Affectation
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Entreprise"
                            value={values.company}
                            onChange={e => handleChange('company', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Campagne"
                            value={values.campaign}
                            onChange={e => handleChange('campaign', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label="Coach"
                            value={values.coach}
                            onChange={e => handleChange('coach', e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Statut
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel id="participant-status-label">Statut</InputLabel>
                        <Select
                            labelId="participant-status-label"
                            label="Statut"
                            value={values.status}
                            onChange={e => handleChange('status', e.target.value as ParticipantFormValues['status'])}
                        >
                            <MenuItem value="pending">En attente</MenuItem>
                            <MenuItem value="active">Actif</MenuItem>
                            <MenuItem value="archived">Archivé</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Stack>
        </AdminDrawerForm>
    );
}

/*
Usage:

const [open, setOpen] = useState(false);

<AdminParticipantDrawerForm
  open={open}
  mode="create"
  onClose={() => setOpen(false)}
  onSubmit={(values) => {
    console.log(values);
  }}
/>
*/
