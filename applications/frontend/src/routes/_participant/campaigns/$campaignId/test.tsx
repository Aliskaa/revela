// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@/components/common/Button';
import { LoadingCard } from '@/components/common/LoadingCard';
import { PageHeader } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignNotActiveBlock } from '@/components/participant-dashboard/CampaignNotActiveBlock';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { ElementHumainQuestionCard } from '@/components/questionnaire/ElementHumainQuestionCard';
import { QuestionnaireProgress } from '@/components/questionnaire/QuestionnaireProgress';
import { type AnswersMap, answerKey } from '@/components/questionnaire/elementHumainAnswers';
import { ELEMENT_HUMAIN_LIKERT } from '@/components/questionnaire/questionnaireScales';
import { useParticipantSession } from '@/hooks/participantSession';
import {
    useElementBDraft,
    useQuestionnaire,
    useSubmitParticipantQuestionnaire,
    useUpsertElementBDraft,
} from '@/hooks/questionnaires';
import { useToast } from '@/lib/toast';
import type { ElementBDraft } from '@aor/types';
import { Alert, Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/test')({
    component: ParticipantTestSessionRoute,
});

const PAGE_SUBTITLE =
    'Répondez aux deux séries de questions : comment vous vous comportez aujourd’hui, puis comment vous souhaiteriez vous comporter.';

/**
 * Extrait toutes les réponses d'une série depuis la map. Retourne `null` si
 * une réponse manque (incomplet → ne pas envoyer comme brouillon de série).
 */
const collectSeriesAnswers = (answers: AnswersMap, seriesIndex: number, questionCount: number): number[] | null => {
    const out: number[] = [];
    for (let q = 0; q < questionCount; q++) {
        const v = answers[answerKey(seriesIndex, q)];
        if (v === null || v === undefined) return null;
        out.push(v);
    }
    return out;
};

/**
 * À partir d'un brouillon serveur, calcule la position de reprise :
 *  - série 1 (questionIndex 0) si série 0 entièrement remplie
 *  - sinon début (0, 0).
 */
const computeResumePosition = (
    draft: ElementBDraft | null,
    seriesCount: number,
    questionCount: number
): { seriesIndex: number; questionIndex: number } => {
    if (!draft) return { seriesIndex: 0, questionIndex: 0 };
    if (draft.series0?.length === questionCount && seriesCount > 1) {
        return { seriesIndex: 1, questionIndex: 0 };
    }
    return { seriesIndex: 0, questionIndex: 0 };
};

function ParticipantTestSessionRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const navigate = useNavigate();
    const toast = useToast();

    const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();

    const assignment = React.useMemo(() => {
        if (!session || !Number.isFinite(campaignId)) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const qid = (assignment?.questionnaire_id ?? '').toUpperCase();
    const safeCampaignId = Number.isFinite(campaignId) ? campaignId : undefined;

    const { data: detail, isLoading: detailLoading, isError } = useQuestionnaire(qid, { enabled: qid.length > 0 });
    const submitMutation = useSubmitParticipantQuestionnaire(qid, safeCampaignId);
    const draftQuery = useElementBDraft(qid, safeCampaignId);
    const upsertDraft = useUpsertElementBDraft(qid, safeCampaignId);

    const [answers, setAnswers] = React.useState<AnswersMap>({});
    const [seriesIndex, setSeriesIndex] = React.useState(0);
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const hydratedFromKeyRef = React.useRef<string | null>(null);

    const seriesCount = detail?.questions.series.length ?? 0;
    const questionCount = detail?.questions.series[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;
    const answeredCount = Object.values(answers).filter(v => v !== null).length;

    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Test Élément Humain' },
    ]);

    const handleAnswer = (key: string, value: number) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    /**
     * Hydratation : applique le brouillon serveur dans le state local une seule fois
     * par identité de brouillon (sinon chaque re-render écraserait la progression).
     */
    React.useEffect(() => {
        if (!detail) return;
        if (draftQuery.isLoading) return;
        const draft = draftQuery.data ?? null;
        const hydrationKey = draft ? `draft:${draft.last_saved_at}` : 'no-draft';
        if (hydratedFromKeyRef.current === hydrationKey) return;
        hydratedFromKeyRef.current = hydrationKey;

        if (!draft) return;

        const next: AnswersMap = {};
        if (draft.series0) {
            draft.series0.forEach((v, i) => {
                next[answerKey(0, i)] = v;
            });
        }
        if (draft.series1) {
            draft.series1.forEach((v, i) => {
                next[answerKey(1, i)] = v;
            });
        }
        setAnswers(prev => ({ ...next, ...prev }));
        const resume = computeResumePosition(draft, seriesCount, questionCount);
        setSeriesIndex(resume.seriesIndex);
        setQuestionIndex(resume.questionIndex);
        toast.info('Brouillon repris — vos réponses précédentes ont été restaurées.');
    }, [detail, draftQuery.data, draftQuery.isLoading, seriesCount, questionCount, toast]);

    /** Sauvegarde le brouillon de la série qui vient d'être complétée (autosave silencieux). */
    const persistSeriesAsDraft = React.useCallback(
        async (completedSeriesIndex: number) => {
            if (typeof safeCampaignId !== 'number') return;
            if (completedSeriesIndex !== 0 && completedSeriesIndex !== 1) return;
            const seriesAnswers = collectSeriesAnswers(answers, completedSeriesIndex, questionCount);
            if (!seriesAnswers) return;
            try {
                await upsertDraft.mutateAsync(
                    completedSeriesIndex === 0 ? { series0: seriesAnswers } : { series1: seriesAnswers }
                );
                toast.success('Brouillon enregistré — vous pouvez reprendre plus tard si besoin.');
            } catch {
                // Échec silencieux côté UI ; le participant peut continuer en mémoire locale.
            }
        },
        [answers, safeCampaignId, questionCount, upsertDraft, toast]
    );

    const handleSeriesIndexChange = (next: number) => {
        if (next > seriesIndex) {
            void persistSeriesAsDraft(seriesIndex);
        }
        setSeriesIndex(next);
    };

    const handleDevFill = () => {
        const filled: Record<string, number> = {};
        for (let s = 0; s < seriesCount; s++) {
            for (let q = 0; q < questionCount; q++) {
                filled[answerKey(s, q)] = Math.floor(Math.random() * ELEMENT_HUMAIN_LIKERT.max);
            }
        }
        setAnswers(filled);
    };

    const handleSubmit = async () => {
        if (!detail) return;

        const series0 = collectSeriesAnswers(answers, 0, questionCount);
        if (!series0) return;
        const series1 = seriesCount > 1 ? collectSeriesAnswers(answers, 1, questionCount) : [];
        if (seriesCount > 1 && !series1) return;

        await submitMutation.mutateAsync({ series0, series1: series1 ?? [] });
        toast.success('Test soumis avec succès ! Redirection vers la campagne…');
        setTimeout(() => {
            if (safeCampaignId !== undefined) {
                navigate({ to: '/campaigns/$campaignId', params: { campaignId: String(safeCampaignId) } });
            } else {
                navigate({ to: '/campaigns' });
            }
        }, 1500);
    };

    const isLoading = sessionLoading || (qid.length > 0 && detailLoading);

    if (isLoading) {
        return <LoadingCard title="Chargement du test" />;
    }

    if (sessionError || !session) {
        return <Alert severity="error">Impossible de charger le test pour le moment.</Alert>;
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

    if (assignment.progression?.element_humain_status === 'completed') {
        return (
            <StepCompletedBanner
                title="Test Élément Humain déjà soumis"
                description="Vous avez complété le test. Pour préserver l'intégrité du parcours, vos réponses ne peuvent plus être modifiées."
            />
        );
    }

    if (assignment.campaign_status !== 'active') {
        return <CampaignNotActiveBlock campaignId={assignment.campaign_id} />;
    }

    if (isError || !detail) {
        return <Alert severity="error">Impossible de charger le questionnaire de la campagne.</Alert>;
    }

    const safeSeriesLabels = detail.questions.series_labels ?? [];
    const effectiveSeriesLabels =
        safeSeriesLabels.length > 0
            ? safeSeriesLabels
            : detail.questions.series.map((_, index) => `Série ${String(index + 1)}`);

    return (
        <Stack spacing={3} sx={{ minWidth: 0, pb: { xs: 4, md: 0 } }}>
            <Box>
                <PageHeader title="Test Élément Humain" subtitle={detail.description || PAGE_SUBTITLE} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {campaignName} · {detail.title}
                    {qid ? ` (${qid})` : ''}
                </Typography>
            </Box>

            <QuestionnaireProgress filled={answeredCount} total={totalQuestions} ariaLabel="Progression du test" />

            {/* @ts-expect-error Vite injects import.meta.env at build time */}
            {import.meta.env.DEV && (
                <Alert
                    severity="info"
                    sx={{ borderRadius: 2 }}
                    action={
                        <Button appearance="secondary" size="small" onClick={handleDevFill}>
                            Remplir tout
                        </Button>
                    }
                >
                    Mode développement — remplir les {totalQuestions} réponses automatiquement.
                </Alert>
            )}

            <ElementHumainQuestionCard
                seriesIndex={seriesIndex}
                questionIndex={questionIndex}
                onSeriesIndexChange={handleSeriesIndexChange}
                onQuestionIndexChange={setQuestionIndex}
                seriesLabels={effectiveSeriesLabels}
                questions={detail.questions.series}
                answers={answers}
                onAnswer={handleAnswer}
                onSubmit={handleSubmit}
                isSubmitting={submitMutation.isPending}
                submitError={submitMutation.isError}
                isAutosaving={upsertDraft.isPending}
            />
        </Stack>
    );
}
