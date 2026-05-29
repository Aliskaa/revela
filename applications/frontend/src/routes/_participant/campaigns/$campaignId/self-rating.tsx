// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@/components/common/Button';
import { KpiCard } from '@/components/common/cards';
import { EmptyState } from '@/components/common/EmptyState';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignNotActiveBlock } from '@/components/participant-dashboard/CampaignNotActiveBlock';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { RatingDimensionCard } from '@/components/questionnaire/RatingDimensionCard';
import { LIKERT_SHORT_LABEL } from '@/components/questionnaire/questionnaireScales';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { useBuildDimensions } from '@/hooks/useBuildDimensions';
import { useToast } from '@/lib/toast';
import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { Alert, Box, LinearProgress, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { BadgeCheck, CheckCircle2, ClipboardList, Hash, Save, Target } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/self-rating')({
    component: ParticipantSelfRatingRoute,
});

const PAGE_SUBTITLE = `Notez chaque item de ${LIKERT_SHORT_LABEL.rangeLabel}. Cette saisie sert de base à la lecture des écarts et à la restitution.`;

const initScoresFromMatrix = (matrix: ParticipantQuestionnaireMatrix): Record<string, number | null> => {
    const scores: Record<string, number | null> = {};
    for (const row of matrix.rows) {
        scores[String(row.score_key)] = row.self;
    }
    return scores;
};

function ParticipantSelfRatingRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const navigate = useNavigate();
    const toast = useToast();
    const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();

    const assignment = React.useMemo(() => {
        if (!session || !Number.isFinite(campaignId)) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const qid = assignment?.questionnaire_id ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        Number.isFinite(campaignId) ? campaignId : undefined
    );
    const submitMutation = useSubmitParticipantQuestionnaire(qid.toUpperCase(), campaignId);

    const [scores, setScores] = React.useState<Record<string, number | null>>({});
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        setInitialized(false);
        setScores({});
    }, [campaignId]);

    React.useEffect(() => {
        if (matrix && !initialized) {
            setScores(initScoresFromMatrix(matrix));
            setInitialized(true);
        }
    }, [matrix, initialized]);

    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Regard sur soi' },
    ]);

    const isLoading = sessionLoading || matrixLoading;
    const campaignActive = assignment?.campaign_status === 'active';
    const stepAvailable =
        assignment?.progression?.self_rating_status === 'pending' ||
        assignment?.progression?.self_rating_status === 'completed' ||
        !assignment?.progression;
    const canSubmit = campaignActive && stepAvailable;
    const questionnaireTitle = matrix?.questionnaire_title ?? assignment?.questionnaire_title ?? 'Regard sur soi';
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
        navigate({ to: '/campaigns/$campaignId', params: { campaignId: String(campaignId) } });
    };

    if (isLoading) {
        return <LoadingCard title="Chargement du Regard sur soi" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger le Regard sur soi pour le moment.</Alert>;
    }

    if (!assignment) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Aucune campagne trouvée pour cet identifiant.
                </Typography>
                <MuiLink component={Link} to="/campaigns" underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    if (assignment.progression?.self_rating_status === 'completed') {
        return (
            <StepCompletedBanner
                title="Regard sur soi déjà soumise"
                description="Vous avez validé votre Regard sur soi. Pour préserver l'intégrité du parcours, elle ne peut plus être modifiée."
            />
        );
    }

    if (!campaignActive) {
        return <CampaignNotActiveBlock campaignId={assignment.campaign_id} />;
    }

    const progressPct = totalItems > 0 ? Math.round((filledCount / totalItems) * 100) : 0;
    const submitButton = (
        <Button
            appearance="primary"
            startIcon={allFilled ? <CheckCircle2 size={16} /> : <Save size={16} />}
            onClick={handleSubmit}
            disabled={!canSubmit || filledCount === 0 || submitMutation.isPending}
            sx={{ width: { xs: '100%', md: 'auto' } }}
        >
            {submitMutation.isPending
                ? 'Enregistrement…'
                : allFilled
                  ? 'Valider le Regard sur soi'
                  : `Enregistrer (${filledCount}/${totalItems})`}
        </Button>
    );

    return (
        <Stack spacing={3} sx={{ minWidth: 0, pb: { xs: 12, md: 0 } }}>
            {totalItems > 0 && (
                <Box
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        position: 'sticky',
                        top: 64,
                        zIndex: 5,
                        mx: -2,
                        mt: -2,
                        px: 2,
                        py: 1.2,
                        bgcolor: 'surface.footerWash',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid',
                        borderBottomColor: 'surface.lavenderGrey',
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

            <Box>
                <AdminPageHeader title="Regard sur soi" subtitle={PAGE_SUBTITLE} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {campaignName} · {questionnaireTitle}
                    {questionnaireCode ? ` (${questionnaireCode})` : ''}
                </Typography>
            </Box>

            <KpiGrid columns={4}>
                <KpiCard
                    label="Questionnaire"
                    value={questionnaireCode || '–'}
                    helper="référence"
                    icon={ClipboardList}
                />
                <KpiCard label="Type" value="Regard sur soi" helper="auto-évaluation" icon={BadgeCheck} />
                <KpiCard
                    label="Échelle"
                    value={LIKERT_SHORT_LABEL.rangeLabel}
                    helper="par item"
                    icon={Hash}
                />
                <KpiCard
                    label="Progression"
                    value={`${filledCount}/${totalItems}`}
                    helper="items complétés"
                    icon={Target}
                />
            </KpiGrid>

            {!canSubmit && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {!campaignActive
                        ? "La campagne n'est pas active. Le Regard sur soi sera disponible une fois la campagne lancée par l'administrateur."
                        : "Cette étape n'est pas encore accessible. Vérifiez l'état de votre parcours."}
                </Alert>
            )}

            <ListPanel
                title="Saisie des dimensions"
                subtitle="Chaque dimension est présentée en bloc. Sélectionnez une note pour chaque item."
                headerBorder
            >
                {dimensions.length === 0 ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={ClipboardList}
                            variant="secondary"
                            title="Aucun item disponible"
                            description="Vérifiez que votre campagne est active et qu'un questionnaire est assigné."
                            boxed={false}
                        />
                    </Box>
                ) : (
                    <>
                        <Stack spacing={2} sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
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

                        <Box
                            sx={{
                                px: { xs: 2.5, md: 4 },
                                pb: 3,
                                display: { xs: 'none', md: 'block' },
                            }}
                        >
                            {submitButton}
                        </Box>
                    </>
                )}
            </ListPanel>

            {dimensions.length > 0 && (
                <Box
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 6,
                        bgcolor: 'surface.footerWash',
                        backdropFilter: 'blur(12px)',
                        borderTop: '1px solid',
                        borderTopColor: 'surface.lavenderGrey',
                        px: 2,
                        py: 1.5,
                    }}
                >
                    {submitButton}
                </Box>
            )}
        </Stack>
    );
}
