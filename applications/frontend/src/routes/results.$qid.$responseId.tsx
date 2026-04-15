import { CalculationBlock } from '@/components/results/CalculationBlock';
import { resolveResultDimDiffPairs } from '@/components/results/resolveResultDimDiffPairs';
import { ParticipantLayout } from '@/components/layout/ParticipantLayout';
import { useResponse } from '@/hooks/responses';
import { userParticipant } from '@/lib/auth';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, FileBarChart2, Printer } from 'lucide-react';

type ResultsSearch = {
    campaign_id?: number;
};

export const Route = createFileRoute('/results/$qid/$responseId')({
    beforeLoad: () => {
        if (!userParticipant.isAuthenticated()) {
            throw redirect({ to: '/login' });
        }
    },
    validateSearch: (search: Record<string, unknown>): ResultsSearch => {
        const campaignRaw = search.campaign_id;
        const campaignId =
            typeof campaignRaw === 'number'
                ? campaignRaw
                : typeof campaignRaw === 'string' && campaignRaw.trim().length > 0
                  ? Number.parseInt(campaignRaw, 10)
                  : undefined;
        return { campaign_id: Number.isFinite(campaignId) ? campaignId : undefined };
    },
    component: ResultsPage,
});

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function ResultsPage() {
    const { responseId } = Route.useParams();
    const { campaign_id: campaignId } = Route.useSearch();
    const { data, isLoading, error } = useResponse(Number(responseId));

    if (isLoading) {
        return (
            <ParticipantLayout activeNav="results" headerTitle="Mes résultats" headerSubtitle="Chargement du rapport...">
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
                    <CircularProgress size={40} thickness={4} />
                </Box>
            </ParticipantLayout>
        );
    }
    if (error || !data) {
        return (
            <ParticipantLayout activeNav="results" headerTitle="Mes résultats" headerSubtitle="Rapport d'évaluation">
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    Résultats introuvables ou accès refusé.
                </Alert>
            </ParticipantLayout>
        );
    }

    return (
        <ParticipantLayout activeNav="results" headerTitle="Mes résultats" headerSubtitle="Rapport d'évaluation">
            {/* Bouton retour discret */}
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
                <Button
                    startIcon={<ArrowLeft size={18} />}
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(21, 21, 176, 0.04)', color: 'primary.main' },
                    }}
                    disableRipple
                >
                    Retour à l'accueil
                </Button>
            </Link>

            {/* En-tête du candidat sous forme de belle carte */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 3,
                    bgcolor: 'background.paper',
                    boxShadow: '0 4px 24px rgba(21, 21, 176, 0.04)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Accent jaune AOR sur le bord gauche */}
                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, bgcolor: 'secondary.main' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, zIndex: 1 }}>
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            width: 72,
                            height: 72,
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(21, 21, 176, 0.2)',
                        }}
                    >
                        {getInitials(data.name)}
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight={900} color="primary.main" lineHeight={1.2} mb={0.5}>
                            {data.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                {data.email}
                            </Typography>
                            {data.organisation && (
                                <>
                                    <Typography variant="body2" color="text.disabled">
                                        •
                                    </Typography>
                                    <Chip
                                        label={data.organisation}
                                        size="small"
                                        sx={{ fontWeight: 600, bgcolor: 'background.default' }}
                                    />
                                </>
                            )}
                        </Stack>
                    </Box>
                </Box>

                <Button
                    startIcon={<Printer size={18} />}
                    variant="outlined"
                    color="primary"
                    onClick={() => window.print()}
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        fontWeight: 700,
                        borderRadius: 2,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                    }}
                >
                    Exporter PDF
                </Button>
            </Paper>

            {/* Titre de section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Box
                    sx={{
                        p: 1,
                        bgcolor: 'rgba(21, 21, 176, 0.08)',
                        borderRadius: 1.5,
                        color: 'primary.main',
                        display: 'flex',
                    }}
                >
                    <FileBarChart2 size={24} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={800} color="text.primary">
                        Rapport d'évaluation
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Questionnaire Type {data.questionnaire_id}
                        </Typography>
                        {campaignId !== undefined && (
                            <>
                                <Typography variant="body2" color="text.disabled">
                                    •
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Campagne #{campaignId}
                                </Typography>
                            </>
                        )}
                    </Stack>
                </Box>
            </Box>

            {/* Contenu principal */}
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 4, lg: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, flexGrow: 1 }}>
                    {data.result_dims.map(dim => (
                        <Paper
                            key={dim.name}
                            variant="outlined"
                            sx={{
                                p: { xs: 2.5, sm: 4 },
                                borderRadius: 3,
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={800}
                                color="primary.main"
                                textTransform="uppercase"
                                letterSpacing={0.5}
                                mb={3}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                            >
                                <Box
                                    component="span"
                                    sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }}
                                />
                                {dim.name}
                            </Typography>

                            {resolveResultDimDiffPairs(dim, data.short_labels).map((pair, i) => (
                                <CalculationBlock
                                    key={`${dim.name}-${i}`}
                                    pair={pair}
                                    scores={data.scores}
                                    shortLabels={data.short_labels}
                                />
                            ))}
                        </Paper>
                    ))}
                </Box>
            </Stack>

            <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', textAlign: 'center', mt: 8, fontWeight: 500 }}
            >
                Document généré le{' '}
                {new Date(data.submitted_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
            </Typography>
        </ParticipantLayout>
    );
}
