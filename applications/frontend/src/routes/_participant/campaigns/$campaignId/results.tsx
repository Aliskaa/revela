// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as React from 'react';

import { QuestionnaireMatrixDisplay } from '@/components/matrix/QuestionnaireMatrixDisplay';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { exportResultsPdf } from '@/lib/exportResultsPdf';
import { buildDimensions } from '@/lib/results/buildDimensions';
import { useToast } from '@/lib/toast';
import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, Download, HelpCircle, Radar, Users } from 'lucide-react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/results')({
    component: ParticipantResultsRoute,
});

function ParticipantResultsRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);

    const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
    const toast = useToast();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const qid = assignment?.questionnaire_id ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        Number.isFinite(campaignId) ? campaignId : undefined
    );

    const hasResults =
        matrix != null &&
        (matrix.self_response_id != null || matrix.peer_columns.length > 0 || matrix.scientific_response_id != null);

    const isLoading = sessionLoading || matrixLoading;
    const coachName = assignment?.coach_name ?? '–';
    const campaignName = assignment?.campaign_name ?? 'Résultats';
    const peerCount = matrix?.peer_columns.length ?? 0;

    const dimensions = React.useMemo(() => (matrix ? buildDimensions(matrix) : []), [matrix]);
    const participantName = session ? `${session.first_name} ${session.last_name}` : '';

    const [pdfPending, setPdfPending] = React.useState(false);

    const handleExportPdf = async () => {
        if (!matrix || dimensions.length === 0) {
            return;
        }
        setPdfPending(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 0));
            exportResultsPdf({
                participantName,
                campaignName,
                coachName,
                questionnaireId: matrix.questionnaire_id,
                peerCount,
                likertMax: matrix.likert_max,
                dimensions,
            });
            toast.success('Synthèse PDF téléchargée.');
        } catch (err) {
            toast.error(err instanceof Error && err.message ? err.message : "Échec de l'export PDF.");
        } finally {
            setPdfPending(false);
        }
    };

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role=`status`` pour annoncer le chargement aux lecteurs d'écran.
            <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement des résultats
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} aria-label="Chargement des résultats" />
                </CardContent>
            </Card>
        );
    }

    if (sessionError || !session) {
        return <Alert severity="error">Impossible de charger vos résultats pour le moment.</Alert>;
    }

    if (!assignment) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">Aucune campagne trouvée pour cet identifiant.</Alert>
                <Button
                    component={Link}
                    to="/campaigns"
                    startIcon={<ArrowLeft size={16} />}
                    variant="outlined"
                    sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                >
                    Retour aux campagnes
                </Button>
            </Stack>
        );
    }

    return (
        <Stack spacing={3}>
            <Link to="/campaigns/$campaignId" params={{ campaignId: String(campaignId) }}>
                <Button
                    startIcon={<ArrowLeft size={16} />}
                    sx={{
                        alignSelf: 'flex-start',
                        fontWeight: 600,
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                    }}
                    disableRipple
                >
                    Retour à la campagne
                </Button>
            </Link>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        direction={{ xs: 'column', lg: 'row' }}
                        spacing={3}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Résultats"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {campaignName}
                            </Typography>
                            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 1, maxWidth: 860 }}>
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    Comparaison détaillée entre l'auto-évaluation, les retours pairs et l'analyse
                                    scientifique, avec écart absolu entre les paires « je suis / je veux ».
                                </Typography>
                                <Tooltip
                                    title="Le test scientifique correspond à l'Élément Humain de Will Schutz : un instrument psychométrique qui mesure vos besoins relationnels (Inclusion / Contrôle / Ouverture) et l'écart entre vos comportements actuels et souhaités."
                                    arrow
                                >
                                    <Box
                                        component="span"
                                        sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help' }}
                                        aria-label="Définition de l'Élément Humain"
                                    >
                                        <HelpCircle size={14} />
                                    </Box>
                                </Tooltip>
                            </Stack>
                            {hasResults && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={handleExportPdf}
                                    disabled={pdfPending}
                                    aria-busy={pdfPending}
                                    sx={{ mt: 2, borderRadius: 99, fontWeight: 700 }}
                                >
                                    {pdfPending ? 'Génération du PDF…' : 'Exporter en PDF'}
                                </Button>
                            )}
                        </Box>

                        <Stack spacing={1.2} sx={{ width: { xs: '100%', sm: 340 } }}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 3,
                                            bgcolor: 'tint.primaryBg',
                                            color: 'primary.main',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Users size={16} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Coach
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="text.primary">
                                            {coachName}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 3,
                                            bgcolor: 'tint.secondaryBg',
                                            color: 'tint.secondaryText',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Radar size={16} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Sources
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="text.primary">
                                            Auto-éval · {peerCount} pair{peerCount !== 1 ? 's' : ''} · Test
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
            {!hasResults ? (
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Les résultats ne sont pas encore disponibles. Complétez les étapes précédentes de votre
                            parcours pour accéder à vos scores.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 2.5, overflow: 'visible' }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <QuestionnaireMatrixDisplay matrix={matrix} />
                    </Box>
                </Card>
            )}
        </Stack>
    );
}
