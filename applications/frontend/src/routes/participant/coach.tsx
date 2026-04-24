import { useParticipantSession } from '@/hooks/participantSession';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import type { ParticipantSession } from '@aor/types';
import { Alert, Box, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { Sparkles, UserRound, Users } from 'lucide-react';
import type * as React from 'react';

export const Route = createFileRoute('/participant/coach')({
    component: ParticipantCoachRoute,
});

type ParticipantAssignment = ParticipantSession['assignments'][number];

type CoachView = {
    name: string;
    title: string;
    company: string;
    status: string;
    bio: string;
    campaignName: string;
    questionnaire: string;
};

const coachFromAssignment = (assignment?: ParticipantAssignment): CoachView => ({
    name: assignment?.coach_name ?? 'Coach non attribué',
    title: 'Coach référent Révéla',
    company: assignment?.company_name ?? '–',
    status: assignment?.campaign_status === 'active' ? 'Disponible' : 'En attente',
    campaignName: assignment?.campaign_name ?? 'Aucune campagne active',
    questionnaire: assignment?.questionnaire_title ?? assignment?.questionnaire_id ?? '–',
    bio: assignment?.coach_name
        ? 'Votre coach accompagne la lecture des résultats et la préparation de la restitution de campagne.'
        : "Aucun coach n'est encore rattaché à votre campagne participant.",
});

function InfoPill({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <Card variant="outlined" sx={{ p: 1.8 }}>
            <Stack direction="row" spacing={1.2} alignItems="start">
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 3,
                        bgcolor: 'tint.secondaryBg',
                        color: 'tint.secondaryText',
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                    }}
                >
                    <Icon size={16} />
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ mt: 0.25, lineHeight: 1.6 }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Card>
    );
}

function ParticipantCoachRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();
    const { assignment: activeAssignment } = useSelectedAssignment(session);
    const coachView = coachFromAssignment(activeAssignment);

    if (isLoading) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                        Chargement de votre coach
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre coach pour le moment.</Alert>;
    }

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
                                label={coachView.status}
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Mon coach
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 840 }}
                            >
                                Cette page présente le coach associé à votre campagne.
                            </Typography>
                        </Box>

                        <Card variant="outlined" sx={{ width: { xs: '100%', sm: 340 } }}>
                            <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography fontWeight={800} color="text.primary">
                                        {coachView.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {coachView.title} · {coachView.company}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Statut
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
                            {coachView.status}
                        </Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Campagne
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
                            {coachView.campaignName}
                        </Typography>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Questionnaire
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5 }}>
                            {coachView.questionnaire}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                        Profil du coach
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                        Lecture simple du rôle et du cadre d'accompagnement.
                    </Typography>
                    <Stack spacing={2.5} sx={{ mt: 1.5 }}>
                        <Box sx={{ borderRadius: 4, bgcolor: 'rgba(15,23,42,0.03)', p: 2.2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                {coachView.bio}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                                gap: 1.5,
                            }}
                        >
                            <InfoPill label="Rôle" value="Accompagnement / restitution" icon={Sparkles} />
                            <InfoPill label="Cadre" value="Confidentialité et lecture partagée" icon={Users} />
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
