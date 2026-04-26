// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as React from 'react';

import { DimensionCard } from '@/components/results/DimensionCard';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import { exportResultsPdf } from '@/lib/exportResultsPdf';
import { PEER_COLORS, buildDimensions } from '@/lib/results/buildDimensions';
import { useToast } from '@/lib/toast';
import { useCampaignStore } from '@/stores/campaignStore';
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
    Tooltip,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { Download, HelpCircle, Radar, Sparkles, UserRound, Users } from 'lucide-react';

export const Route = createFileRoute('/participant/results')({
    component: ParticipantResultsRoute,
});

function ParticipantResultsRoute() {
    const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
    const { assignment: selectedAssignment, index: selectedIndex, assignments } = useSelectedAssignment(session);
    const selectCampaign = useCampaignStore(s => s.select);
    const toast = useToast();

    const qid = selectedAssignment?.questionnaire_id ?? '';
    const campaignId = selectedAssignment?.campaign_id ?? undefined;

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);

    const isLoading = sessionLoading || matrixLoading;
    const coachName = selectedAssignment?.coach_name ?? '–';
    const campaignName = selectedAssignment?.campaign_name ?? 'Résultats';
    const peerCount = matrix?.peer_columns.length ?? 0;
    const peerLabels = React.useMemo(() => matrix?.peer_columns.map(pc => pc.label) ?? [], [matrix]);

    const dimensions = React.useMemo(() => (matrix ? buildDimensions(matrix) : []), [matrix]);

    const participantName = session ? `${session.first_name} ${session.last_name}` : '';

    const [pdfPending, setPdfPending] = React.useState(false);

    const handleExportPdf = async () => {
        if (!matrix || dimensions.length === 0) {
            return;
        }
        setPdfPending(true);
        try {
            // jsPDF est synchrone mais peut bloquer le thread sur de gros PDF — on cède la main pour
            // laisser le state "pending" se peindre avant l'export.
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

    return (
        <Stack spacing={3}>
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
                                    Synthèse des scores par dimension : auto-évaluation, moyenne des pairs et test
                                    scientifique.
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
                            {dimensions.length > 0 && (
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
                            {assignments.length > 1 && (
                                <FormControl size="small" sx={{ mt: 2, minWidth: 300 }}>
                                    <InputLabel>Campagne</InputLabel>
                                    <Select
                                        label="Campagne"
                                        value={selectedIndex}
                                        onChange={e => {
                                            const idx = e.target.value as number;
                                            const a = assignments[idx];
                                            if (a?.campaign_id !== null && a?.campaign_id !== undefined) {
                                                selectCampaign(a.campaign_id);
                                            }
                                        }}
                                    >
                                        {assignments.map((a, i) => (
                                            <MenuItem key={`${a.campaign_id}-${a.questionnaire_id}`} value={i}>
                                                {a.campaign_name ?? 'Campagne'} —{' '}
                                                {a.questionnaire_title ?? a.questionnaire_id}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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

            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                    label="Auto-évaluation"
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', fontWeight: 700 }}
                />
                {peerLabels.map((name, i) => (
                    <Chip
                        key={name}
                        label={name}
                        size="small"
                        sx={{
                            borderRadius: 99,
                            bgcolor: 'tint.secondaryBg',
                            color: 'tint.secondaryText',
                            fontWeight: 700,
                            borderLeft: `3px solid ${PEER_COLORS[i % PEER_COLORS.length]}`,
                        }}
                    />
                ))}
                <Chip
                    label="Test scientifique"
                    size="small"
                    sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText', fontWeight: 700 }}
                />
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="end">
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Dimensions
                                </Typography>
                                <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    color="text.primary"
                                    sx={{ mt: 0.5, letterSpacing: -0.5 }}
                                >
                                    {dimensions.length}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 3,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <Radar size={18} />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="end">
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Pairs
                                </Typography>
                                <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    color="text.primary"
                                    sx={{ mt: 0.5, letterSpacing: -0.5 }}
                                >
                                    {peerCount}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 3,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <UserRound size={18} />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="end">
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Questionnaire
                                </Typography>
                                <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    color="text.primary"
                                    sx={{ mt: 0.5, letterSpacing: -0.5 }}
                                >
                                    {matrix?.questionnaire_id ?? '–'}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 3,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    display: 'grid',
                                    placeItems: 'center',
                                }}
                            >
                                <Sparkles size={18} />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

            {dimensions.length === 0 && !matrixLoading ? (
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Les résultats ne sont pas encore disponibles. Complétez les étapes précédentes de votre
                            parcours pour accéder à vos scores.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {dimensions.map(dimension => (
                        <DimensionCard key={dimension.name} dimension={dimension} likertMax={matrix?.likert_max ?? 9} />
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
