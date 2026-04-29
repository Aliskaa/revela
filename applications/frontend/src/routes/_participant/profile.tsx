import { InfoCard } from '@/components/common/InfoCard';
import { useParticipantSession, useUpdateParticipantProfile } from '@/hooks/participantSession';
import type { ParticipantFunctionLevel } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Mail, PencilLine, UserRound } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/profile')({
    component: ParticipantProfileRoute,
});

function ParticipantProfileRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();
    const updateProfile = useUpdateParticipantProfile();

    const [organisation, setOrganisation] = React.useState('');
    const [direction, setDirection] = React.useState('');
    const [service, setService] = React.useState('');
    const [functionLevel, setFunctionLevel] = React.useState<ParticipantFunctionLevel | ''>('');
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        if (session && !initialized) {
            setOrganisation(session.organisation ?? '');
            setDirection(session.direction ?? '');
            setService(session.service ?? '');
            setFunctionLevel(session.function_level ?? '');
            setInitialized(true);
        }
    }, [session, initialized]);

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role=`status`` (équivalent ARIA d`un live region) pour annoncer le chargement aux lecteurs d`écran.
            <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement du profil
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} aria-label="Chargement du profil" />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre profil pour le moment.</Alert>;
    }

    const firstName = session.first_name ?? '';
    const lastName = session.last_name ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Participant';
    const email = session.email ?? '–';
    const activeAssignment = session.assignments.find(a => a.campaign_status === 'active') ?? session.assignments[0];
    const company = activeAssignment?.company_name ?? '–';

    const handleSave = async () => {
        // Toasts success/error gérés par le hook ; on attrape pour ne pas faire planter le composant.
        try {
            await updateProfile.mutateAsync({
                organisation: organisation.trim() || null,
                direction: direction.trim() || null,
                service: service.trim() || null,
                function_level: functionLevel || null,
            });
        } catch {
            // intentional no-op
        }
    };

    const handleReset = () => {
        setOrganisation(session.organisation ?? '');
        setDirection(session.direction ?? '');
        setService(session.service ?? '');
        setFunctionLevel(session.function_level ?? '');
    };

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Profil participant"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Mon profil
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Consultez et complétez vos informations personnelles liées à la campagne.
                            </Typography>
                        </Box>
                        <Card
                            variant="outlined"
                            sx={{ bgcolor: 'rgba(15,23,42,0.03)', p: 2.2, width: { xs: '100%', sm: 340 } }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 4,
                                        bgcolor: 'primary.main',
                                        color: '#fff',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <UserRound size={20} />
                                </Box>
                                <Box>
                                    <Typography fontWeight={800} color="text.primary">
                                        {fullName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Participant actif
                                    </Typography>
                                </Box>
                            </Stack>
                        </Card>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <InfoCard icon={UserRound} label="Nom" value={fullName} />
                <InfoCard icon={Mail} label="Email" value={email} />
                <InfoCard icon={Building2} label="Entreprise" value={company} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                        Informations complémentaires
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                        Ces informations enrichissent votre profil dans le cadre de la campagne.
                    </Typography>

                    <Stack spacing={2} sx={{ mt: 2.5 }}>
                        <TextField
                            label="Organisation"
                            value={organisation}
                            onChange={e => setOrganisation(e.target.value)}
                            fullWidth
                            placeholder="Ex : Ville de Lyon"
                        />
                        <TextField
                            label="Direction"
                            value={direction}
                            onChange={e => setDirection(e.target.value)}
                            fullWidth
                            placeholder="Ex : Direction Sports & Jeunesse"
                        />
                        <TextField
                            label="Service"
                            value={service}
                            onChange={e => setService(e.target.value)}
                            fullWidth
                            placeholder="Ex : Développement des équipes"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Niveau de fonction</InputLabel>
                            <Select
                                label="Niveau de fonction"
                                value={functionLevel}
                                onChange={e => setFunctionLevel(e.target.value as ParticipantFunctionLevel | '')}
                            >
                                <MenuItem value="">Non renseigné</MenuItem>
                                <MenuItem value="direction">Direction</MenuItem>
                                <MenuItem value="middle_management">Management intermédiaire</MenuItem>
                                <MenuItem value="frontline_manager">Manager de proximité</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {updateProfile.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Erreur lors de la mise à jour du profil.
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 2.5 }}>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<PencilLine size={16} />}
                            onClick={handleSave}
                            disabled={updateProfile.isPending}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                        >
                            {updateProfile.isPending ? 'Enregistrement…' : 'Mettre à jour'}
                        </Button>
                        <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 3 }}>
                            Réinitialiser
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
