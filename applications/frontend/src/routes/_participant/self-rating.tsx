import { LoadingCard } from '@/components/common/LoadingCard';
import { StatCard } from '@/components/common/cards';
import { CampaignNotActiveBlock } from '@/components/participant-dashboard/CampaignNotActiveBlock';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { RatingDimensionCard } from '@/components/questionnaire/RatingDimensionCard';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { useBuildDimensions } from '@/hooks/useBuildDimensions';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import { useToast } from '@/lib/toast';
import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { Alert, Box, Button, Card, CardContent, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BadgeCheck, CheckCircle2, ClipboardList, Hash, Save, Sparkles, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/self-rating')({
    component: ParticipantSelfRatingRoute,
});

const initScoresFromMatrix = (matrix: ParticipantQuestionnaireMatrix): Record<string, number | null> => {
    const scores: Record<string, number | null> = {};
    for (const row of matrix.rows) {
        scores[String(row.score_key)] = row.self;
    }
    return scores;
};

function ParticipantSelfRatingRoute() {
    const navigate = useNavigate();
    const toast = useToast();
    const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();

    const { assignment: activeAssignment } = useSelectedAssignment(session);
    const qid = activeAssignment?.questionnaire_id ?? '';
    const campaignId = activeAssignment?.campaign_id ?? undefined;

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);
    const submitMutation = useSubmitParticipantQuestionnaire(qid.toUpperCase(), campaignId);

    const [scores, setScores] = React.useState<Record<string, number | null>>({});
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        if (matrix && !initialized) {
            setScores(initScoresFromMatrix(matrix));
            setInitialized(true);
        }
    }, [matrix, initialized]);

    const isLoading = sessionLoading || matrixLoading;
    const campaignActive = activeAssignment?.campaign_status === 'active';
    const stepAvailable =
        activeAssignment?.progression?.self_rating_status === 'pending' ||
        activeAssignment?.progression?.self_rating_status === 'completed' ||
        !activeAssignment?.progression;
    const canSubmit = campaignActive && stepAvailable;
    const questionnaireTitle = matrix?.questionnaire_title ?? activeAssignment?.questionnaire_title ?? 'Regard sur soi';
    const questionnaireCode = matrix?.questionnaire_id ?? qid;

    const dimensions = useBuildDimensions(matrix);

    const totalItems = matrix?.rows.length ?? 0;
    const filledCount = Object.values(scores).filter(v => v !== null).length;
    const allFilled = totalItems > 0 && filledCount === totalItems;

    const handleScoreChange = (scoreKey: string, value: number) => {
        setScores(prev => ({ ...prev, [scoreKey]: value }));
    };

    const handleSubmit = async () => {
        const payload: Record<string, number> = {};
        for (const [k, v] of Object.entries(scores)) {
            if (v !== null) payload[k] = v;
        }
        try {
            await submitMutation.mutateAsync({ kind: 'self_rating', scores: payload });
        } catch {
            toast.error("Erreur lors de l'enregistrement. Réessayez.");
            return;
        }
        toast.success('Regard sur soi enregistrée');
        // Après validation d'une étape du parcours, retour systématique sur la fiche
        // de la campagne concernée (cf. P10 du suivi produit 2026-05-02).
        if (campaignId !== undefined) {
            navigate({ to: '/campaigns/$campaignId', params: { campaignId: String(campaignId) } });
        } else {
            navigate({ to: '/' });
        }
    };

    if (isLoading) {
        return <LoadingCard title="Chargement du Regard sur soi" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger le Regard sur soi pour le moment.</Alert>;
    }

    if (activeAssignment?.progression?.self_rating_status === 'completed') {
        return (
            <StepCompletedBanner
                title="Regard sur soi déjà soumise"
                description="Vous avez validé votre Regard sur soi. Pour préserver l'intégrité du parcours, elle ne peut plus être modifiée."
            />
        );
    }

    if (activeAssignment && !campaignActive) {
        return <CampaignNotActiveBlock campaignId={activeAssignment.campaign_id} />;
    }

    const progressPct = totalItems > 0 ? Math.round((filledCount / totalItems) * 100) : 0;
    const submitButton = (
        <Button
            variant="contained"
            disableElevation
            startIcon={allFilled ? <CheckCircle2 size={16} /> : <Save size={16} />}
            onClick={handleSubmit}
            disabled={!canSubmit || filledCount === 0 || submitMutation.isPending}
            sx={{ borderRadius: 3 }}
        >
            {submitMutation.isPending
                ? 'Enregistrement…'
                : allFilled
                  ? 'Valider le Regard sur soi'
                  : `Enregistrer (${filledCount}/${totalItems})`}
        </Button>
    );

    return (
        <Stack spacing={3} sx={{ pb: { xs: 12, md: 0 } }}>
            {/*
                Bandeau de progression sticky : visible uniquement sur mobile (xs/sm) une fois la
                première note saisie. Permet au participant de garder une vue sur sa progression
                en scrollant les dimensions sans avoir à remonter.
                `top: 68px` correspond à la hauteur du `MobileTopBar` (Toolbar minHeight 68).
            */}
            {totalItems > 0 && (
                <Box
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        position: 'sticky',
                        top: 68,
                        zIndex: 5,
                        mx: -2,
                        mt: -2,
                        px: 2,
                        py: 1.2,
                        bgcolor: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid',
                        borderBottomColor: 'border',
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography variant="caption" fontWeight={700} color="text.primary">
                            {filledCount} / {totalItems}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progressPct}
                            aria-label="Progression du Regard sur soi"
                            sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 99,
                                bgcolor: 'tint.subtleBg',
                                '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {progressPct}%
                        </Typography>
                    </Stack>
                </Box>
            )}

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
                                label="Regard sur soi"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {questionnaireTitle}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Notez chaque item de 1 à 9. Cette saisie sert de base à la lecture des écarts et à la
                                restitution.
                            </Typography>
                        </Box>

                        <Card variant="outlined" sx={{ width: { xs: '100%', sm: 340 } }}>
                            <CardContent sx={{ p: 2 }}>
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
                                        <Sparkles size={20} />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={800} color="text.primary">
                                            {filledCount} / {totalItems}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            items complétés
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    variant="compact"
                    icon={ClipboardList}
                    label="Questionnaire"
                    value={questionnaireCode || '–'}
                    frame="box"
                />
                <StatCard variant="compact" icon={BadgeCheck} label="Type" value="Regard sur soi" frame="box" />
                <StatCard variant="compact" icon={Hash} label="Échelle" value="1 à 9" frame="box" />
                <StatCard
                    variant="compact"
                    icon={Users}
                    label="Progression"
                    value={`${filledCount} / ${totalItems}`}
                    frame="box"
                />
            </Box>

            {!canSubmit && (
                <Alert severity="warning">
                    {!campaignActive
                        ? "La campagne n'est pas active. Le Regard sur soi sera disponible une fois la campagne lancée par l'administrateur."
                        : "Cette étape n'est pas encore accessible. Vérifiez l'état de votre parcours."}
                </Alert>
            )}

            {dimensions.length === 0 ? (
                <Card variant="outlined">
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Aucun item disponible. Vérifiez que votre campagne est active et qu'un questionnaire est
                            assigné.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Saisie des short labels
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                            Chaque dimension est présentée en bloc. Sélectionnez une note pour chaque item.
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={2}>
                            {dimensions.map(block => (
                                <RatingDimensionCard
                                    key={block.dimension}
                                    block={block}
                                    scores={scores}
                                    onScoreChange={handleScoreChange}
                                    chipLabel="Regard sur soi"
                                />
                            ))}
                        </Stack>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.2}
                            sx={{ mt: 3, display: { xs: 'none', md: 'flex' } }}
                        >
                            {submitButton}
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/*
                Footer sticky mobile : reproduit le bouton de soumission en bas d'écran pour
                éviter le scroll-to-bottom à chaque dimension complétée. `position: fixed` (et non
                sticky) garantit la visibilité même quand on est au milieu de la liste.
            */}
            {dimensions.length > 0 && (
                <Box
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 6,
                        bgcolor: 'rgba(255,255,255,0.96)',
                        backdropFilter: 'blur(10px)',
                        borderTop: '1px solid',
                        borderTopColor: 'border',
                        px: 2,
                        py: 1.5,
                    }}
                >
                    <Box sx={{ '& > button': { width: '100%' } }}>{submitButton}</Box>
                </Box>
            )}
        </Stack>
    );
}
