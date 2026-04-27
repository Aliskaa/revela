// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ClipboardList, Hash, MessageSquareText, Sparkles, Users } from 'lucide-react';

import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/StatCard';
import { useAdminResponse } from '@/hooks/admin';
import type { ResponseSubmissionKind } from '@aor/types';

export const Route = createFileRoute('/admin/responses/$responseId')({
    component: AdminResponseDetailRoute,
});

const SUBMISSION_KIND_LABELS: Record<ResponseSubmissionKind, string> = {
    element_humain: 'Test Élément Humain',
    self_rating: 'Auto-évaluation',
    peer_rating: 'Feedback des pairs',
};

const SUBMISSION_KIND_TINT: Record<ResponseSubmissionKind, { bg: string; text: string }> = {
    element_humain: { bg: 'tint.successBg', text: 'tint.successText' },
    self_rating: { bg: 'tint.primaryBg', text: 'primary.main' },
    peer_rating: { bg: 'tint.secondaryBg', text: 'tint.secondaryText' },
};

function AdminResponseDetailRoute() {
    const { responseId } = Route.useParams();
    const numericId = Number(responseId);

    const { data: detail, isLoading, isError } = useAdminResponse(numericId);

    if (isLoading) {
        return (
            // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role=`status`` pour annoncer le chargement aux lecteurs d'écran.
            <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="text.primary">
                        Chargement de la réponse
                    </Typography>
                    <LinearProgress sx={{ mt: 2 }} aria-label="Chargement de la réponse" />
                </CardContent>
            </Card>
        );
    }

    if (isError || !detail) {
        return (
            <Stack spacing={3}>
                <Alert severity="error">Impossible de charger la réponse demandée.</Alert>
                <Button
                    component={Link}
                    to="/admin/responses"
                    variant="outlined"
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ alignSelf: 'flex-start', borderRadius: 3 }}
                >
                    Retour aux réponses
                </Button>
            </Stack>
        );
    }

    const kindLabel = SUBMISSION_KIND_LABELS[detail.submission_kind];
    const kindTint = SUBMISSION_KIND_TINT[detail.submission_kind];
    const submittedDate = new Date(detail.submitted_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const submittedTime = new Date(detail.submitted_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const scoreKeys = Object.keys(detail.scores);

    const labelFor = (scoreId: number): string => {
        const key = String(scoreId);
        return detail.score_labels[key] ?? detail.short_labels[key] ?? key;
    };
    const shortLabelFor = (scoreId: number): string => {
        const key = String(scoreId);
        return detail.short_labels[key] ?? key;
    };
    const valueFor = (scoreId: number): number | undefined => detail.scores[String(scoreId)];

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
                                label={kindLabel}
                                sx={{ borderRadius: 99, bgcolor: kindTint.bg, color: kindTint.text, mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Réponse #{detail.id}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 900 }}
                            >
                                Soumission de <strong>{detail.name || 'Anonyme'}</strong>
                                {detail.email ? ` (${detail.email})` : ''} pour le questionnaire{' '}
                                <strong>{detail.questionnaire_id}</strong>.
                            </Typography>
                        </Box>

                        <Button
                            component={Link}
                            to="/admin/responses"
                            variant="outlined"
                            startIcon={<ArrowLeft size={16} />}
                            sx={{ borderRadius: 3 }}
                        >
                            Retour aux réponses
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard label="Type" value={kindLabel} icon={MessageSquareText} />
                <StatCard label="Questionnaire" value={detail.questionnaire_id} icon={ClipboardList} />
                <StatCard label="Scores collectés" value={scoreKeys.length} icon={Hash} />
                <StatCard label="Soumis le" value={submittedDate} helper={submittedTime} icon={Sparkles} />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Identité & contexte"
                        subtitle="Informations sur le participant et la soumission."
                    />

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <MiniStat label="Nom" value={detail.name || '–'} />
                        <MiniStat label="Email" value={detail.email || '–'} />
                        <MiniStat label="Organisation" value={detail.organisation || '–'} />
                        {detail.subject_participant_id !== null && (
                            <MiniStat label="Participant sujet" value={`#${detail.subject_participant_id}`} />
                        )}
                        {detail.rater_participant_id !== null && (
                            <MiniStat label="Évaluateur" value={`#${detail.rater_participant_id}`} />
                        )}
                        {detail.rated_participant_id !== null && (
                            <MiniStat label="Évalué" value={`#${detail.rated_participant_id}`} />
                        )}
                    </Box>
                </CardContent>
            </Card>

            {detail.result_dims.length > 0 ? (
                <Stack spacing={2}>
                    <SectionTitle
                        title="Scores par dimension"
                        subtitle="Détail des scores collectés, regroupés selon la structure du questionnaire."
                    />
                    {detail.result_dims.map(dim => (
                        <Card variant="outlined" key={dim.name}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 3,
                                            bgcolor: 'tint.primaryBg',
                                            color: 'primary.main',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Users size={16} />
                                    </Box>
                                    <Typography variant="h6" fontWeight={800} color="text.primary">
                                        {dim.name}
                                    </Typography>
                                    <Chip
                                        label={`${dim.scores.length} score${dim.scores.length > 1 ? 's' : ''}`}
                                        size="small"
                                        sx={{
                                            borderRadius: 99,
                                            bgcolor: 'tint.subtleBg',
                                            color: 'text.secondary',
                                            ml: 1,
                                        }}
                                    />
                                </Stack>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 80 }}>Code</TableCell>
                                            <TableCell>Libellé</TableCell>
                                            <TableCell align="right" sx={{ width: 100 }}>
                                                Score
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dim.scores.map(scoreId => {
                                            const value = valueFor(scoreId);
                                            return (
                                                <TableRow key={scoreId} hover>
                                                    <TableCell>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                                                        >
                                                            {shortLabelFor(scoreId)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.primary">
                                                            {labelFor(scoreId)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={700} color="text.primary">
                                                            {value ?? '–'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            ) : (
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle
                            title="Scores bruts"
                            subtitle="Aucune dimension structurée n'est associée à ce questionnaire — affichage des scores tels quels."
                        />
                        <Table size="small" sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Clé</TableCell>
                                    <TableCell align="right" sx={{ width: 120 }}>
                                        Score
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scoreKeys.map(key => (
                                    <TableRow key={key} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {detail.short_labels[key] ?? key}
                                            </Typography>
                                            {detail.score_labels[key] && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {detail.score_labels[key]}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={700} color="text.primary">
                                                {detail.scores[key]}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </Stack>
    );
}
