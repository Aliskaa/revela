import { useCoaches, useCompanies, useCreateAdminCampaign } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    Drawer,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

export default function CampaignForm() {
    const { data: companies } = useCompanies();
    const { data: coaches } = useCoaches();
    const { data: questionnaires } = useAdminQuestionnaires();
    const createCampaign = useCreateAdminCampaign();

    // États du formulaire
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [coachId, setCoachId] = useState('');
    const [questionnaireId, setQuestionnaireId] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [status, setStatus] = useState<'draft' | 'active' | 'closed' | 'archived'>('draft');
    const [allowWithoutManual, setAllowWithoutManual] = useState(false);

    // États de l'interface
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleCreate = async () => {
        await createCampaign.mutateAsync({
            name: name.trim(),
            companyId: Number(companyId),
            coachId: Number(coachId),
            questionnaireId,
            startsAt: startsAt ? new Date(startsAt).toISOString() : null,
            endsAt: endsAt ? new Date(endsAt).toISOString() : null,
            allowTestWithoutManualInputs: allowWithoutManual,
            status,
        });

        // Réinitialisation et fermeture si succès
        if (!createCampaign.isError) {
            setName('');
            setCompanyId('');
            setCoachId('');
            setQuestionnaireId('');
            setStartsAt('');
            setEndsAt('');
            setStatus('draft');
            setAllowWithoutManual(false);
            setIsDrawerOpen(false);
        }
    };
    return (
        <>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDrawerOpen(true)}
                sx={{ boxShadow: 2, fontWeight: 600 }}
            >
                + Nouvelle Campagne
            </Button>
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 450 }, p: 0 },
                }}
            >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            Initialiser une campagne
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Remplissez les informations ci-dessous pour lancer une nouvelle campagne V1.
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Stack spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                        <TextField
                            label="Nom de campagne"
                            fullWidth
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Entreprise</InputLabel>
                            <Select
                                label="Entreprise"
                                value={companyId}
                                onChange={e => setCompanyId(String(e.target.value))}
                            >
                                {companies?.map(company => (
                                    <MenuItem key={company.id} value={String(company.id)}>
                                        {company.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Coach</InputLabel>
                            <Select label="Coach" value={coachId} onChange={e => setCoachId(String(e.target.value))}>
                                {coaches?.map(coach => (
                                    <MenuItem key={coach.id} value={String(coach.id)}>
                                        {coach.displayName} ({coach.username})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Questionnaire</InputLabel>
                            <Select
                                label="Questionnaire"
                                value={questionnaireId}
                                onChange={e => setQuestionnaireId(String(e.target.value))}
                            >
                                {questionnaires?.map(q => (
                                    <MenuItem key={q.id} value={q.id}>
                                        {q.id} — {q.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Statut initial</InputLabel>
                            <Select
                                label="Statut initial"
                                value={status}
                                onChange={e => setStatus(e.target.value as 'draft' | 'active' | 'closed' | 'archived')}
                            >
                                <MenuItem value="draft">Brouillon (Draft)</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="closed">Fermée (Closed)</MenuItem>
                                <MenuItem value="archived">Archivée</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Date de début"
                                type="datetime-local"
                                fullWidth
                                value={startsAt}
                                onChange={e => setStartsAt(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="Date de fin"
                                type="datetime-local"
                                fullWidth
                                value={endsAt}
                                onChange={e => setEndsAt(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>

                        <FormControlLabel
                            sx={{ mt: 1 }}
                            control={
                                <Checkbox
                                    checked={allowWithoutManual}
                                    onChange={(_, checked) => setAllowWithoutManual(checked)}
                                    color="primary"
                                />
                            }
                            label="Autoriser le test sans inputs manuels"
                        />

                        {createCampaign.isError && (
                            <Alert severity="error">
                                {createCampaign.error.message || 'Erreur lors de la création.'}
                            </Alert>
                        )}
                        {createCampaign.isSuccess && (
                            <Alert severity="success">Campagne initialisée avec succès.</Alert>
                        )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setIsDrawerOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={
                                createCampaign.isPending ||
                                name.trim().length < 3 ||
                                !companyId ||
                                !coachId ||
                                !questionnaireId
                            }
                            onClick={handleCreate}
                        >
                            {createCampaign.isPending ? 'Création...' : 'Créer la campagne'}
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
}
