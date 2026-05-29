import * as React from 'react';

import { CampaignNotActiveBlock } from '@/components/participant-dashboard/CampaignNotActiveBlock';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { RatingScale } from '@/components/questionnaire/RatingScale';
import { ELEMENT_HUMAIN_LIKERT } from '@/components/questionnaire/questionnaireScales';
import { useParticipantSession } from '@/hooks/participantSession';
import {
    useElementBDraft,
    useQuestionnaire,
    useSubmitParticipantQuestionnaire,
    useUpsertElementBDraft,
} from '@/hooks/questionnaires';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import { useToast } from '@/lib/toast';
import type { ElementBDraft, Question } from '@aor/types';
import { Alert, Box, Button, Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Heart, Loader2, Save, Send, Sparkles, Users } from 'lucide-react';

export const Route = createFileRoute('/_participant/test/$questionnaireCode')({
    component: ParticipantTestSessionRoute,
});

const ANSWER_MIN = ELEMENT_HUMAIN_LIKERT.min;
const ANSWER_MAX = ELEMENT_HUMAIN_LIKERT.max;

function normalizeCode(value: string | undefined): string {
    return value?.trim().toUpperCase() || 'B';
}

function LoadingState() {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <Typography variant="body1" color="text.secondary">
                        Chargement du questionnaire…
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ErrorState() {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} color="text.primary">
                    Impossible de charger le questionnaire
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.7 }}>
                    Vérifie l'identifiant du questionnaire ou le chargement de la campagne.
                </Typography>
            </CardContent>
        </Card>
    );
}

type AnswersMap = Record<string, number | null>;

/**
 * Construit une clé `"series-question"` pour stocker une réponse dans la map.
 * Choisi pour rester sérialisable et permettre une hydratation directe depuis
 * un brouillon (`series0[i]` → clé `"0-i"`).
 */
const answerKey = (seriesIndex: number, questionIndex: number) => `${String(seriesIndex)}-${String(questionIndex)}`;

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
 * On ne saute pas dans la série 1 même si elle est remplie : la reprise mid-série
 * n'est pas un cas réel (on ne sauvegarde qu'en fin de série), et redémarrer série 1
 * permet au participant de re-vérifier ses réponses si jamais il revient.
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

function QuestionCard({
    seriesIndex,
    questionIndex,
    onSeriesIndexChange,
    onQuestionIndexChange,
    seriesLabels,
    questions,
    answers,
    onAnswer,
    onSubmit,
    isSubmitting,
    submitError,
    isAutosaving,
}: {
    seriesIndex: number;
    questionIndex: number;
    onSeriesIndexChange: (next: number) => void;
    onQuestionIndexChange: (next: number) => void;
    seriesLabels: string[];
    questions: Question[][];
    answers: AnswersMap;
    onAnswer: (key: string, value: number) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    submitError: boolean;
    isAutosaving: boolean;
}) {
    const seriesCount = questions.length;
    const questionCount = questions[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;

    const currentQuestion = questions[seriesIndex]?.[questionIndex];
    const currentLabel = seriesLabels[seriesIndex] ?? `Série ${String(seriesIndex + 1)}`;
    const currentStep = seriesIndex * questionCount + questionIndex + 1;
    const progress = totalQuestions > 0 ? Math.round((currentStep / totalQuestions) * 100) : 0;
    const prevDisabled = seriesIndex === 0 && questionIndex === 0;
    const isLastQuestion = seriesIndex === seriesCount - 1 && questionIndex === questionCount - 1;

    const currentKey = answerKey(seriesIndex, questionIndex);
    const currentAnswer = answers[currentKey] ?? null;

    const answeredCount = Object.values(answers).filter(v => v !== null).length;
    const allAnswered = answeredCount === totalQuestions;

    const goNext = () => {
        if (questionIndex < questionCount - 1) {
            onQuestionIndexChange(questionIndex + 1);
            return;
        }
        if (seriesIndex < seriesCount - 1) {
            onSeriesIndexChange(seriesIndex + 1);
            onQuestionIndexChange(0);
        }
    };

    const goPrev = () => {
        if (questionIndex > 0) {
            onQuestionIndexChange(questionIndex - 1);
            return;
        }
        if (seriesIndex > 0) {
            onSeriesIndexChange(seriesIndex - 1);
            onQuestionIndexChange(questionCount - 1);
        }
    };

    const handleSelect = (value: number) => {
        onAnswer(currentKey, value);
    };

    if (!currentQuestion) {
        return null;
    }

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="start"
                        spacing={2}
                        flexWrap="wrap"
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Série {seriesIndex + 1} / {seriesCount}
                            </Typography>
                            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 0.35 }}>
                                {currentLabel}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Question {currentStep} / {totalQuestions}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {isAutosaving && (
                                <Chip
                                    icon={<Save size={14} />}
                                    label="Sauvegarde…"
                                    size="small"
                                    sx={{
                                        borderRadius: 99,
                                        bgcolor: 'tint.secondaryBg',
                                        color: 'tint.secondaryText',
                                        fontWeight: 700,
                                    }}
                                />
                            )}
                            <Chip
                                label={`${String(answeredCount)} / ${String(totalQuestions)}`}
                                size="small"
                                sx={{
                                    borderRadius: 99,
                                    bgcolor: 'tint.successBg',
                                    color: 'tint.successText',
                                    fontWeight: 700,
                                }}
                            />
                            <Chip
                                label={`${String(progress)}%`}
                                size="small"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }}
                            />
                        </Stack>
                    </Stack>

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 10,
                            borderRadius: 99,
                            bgcolor: 'tint.subtleBg',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                        }}
                    />

                    <Box sx={{ borderRadius: 5, bgcolor: 'rgba(15,23,42,0.03)', p: 2.2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Question actuelle
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            color="text.primary"
                            sx={{ mt: 0.5, lineHeight: 1.55 }}
                        >
                            {currentQuestion.question}
                        </Typography>
                    </Box>

                    <Box sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 2 }}>
                        <Stack spacing={1.2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                <Typography variant="body2" fontWeight={700} color="text.primary">
                                    Échelle {ELEMENT_HUMAIN_LIKERT.rangeLabel}
                                </Typography>
                                <Chip
                                    label={currentAnswer ?? '—'}
                                    size="small"
                                    sx={{
                                        borderRadius: 99,
                                        bgcolor: currentAnswer !== null ? 'tint.primaryBg' : 'tint.secondaryBg',
                                        color: currentAnswer !== null ? 'primary.main' : 'tint.secondaryText',
                                    }}
                                />
                            </Stack>
                            <RatingScale
                                value={currentAnswer}
                                onChange={v => {
                                    if (v !== null) handleSelect(v);
                                }}
                                max={ANSWER_MAX}
                                min={ANSWER_MIN}
                                endpointLabels={ELEMENT_HUMAIN_LIKERT.endpointLabels}
                                ariaLabel={currentQuestion.question}
                            />
                        </Stack>
                    </Box>

                    {submitError && (
                        <Alert severity="error">
                            Une erreur est survenue lors de la soumission. Veuillez réessayer.
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowLeft size={16} />}
                            disabled={prevDisabled}
                            onClick={goPrev}
                            sx={{ borderRadius: 3 }}
                        >
                            Précédent
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {isLastQuestion ? (
                            <Button
                                variant="contained"
                                disableElevation
                                startIcon={<Send size={16} />}
                                disabled={!allAnswered || isSubmitting}
                                onClick={onSubmit}
                                sx={{ borderRadius: 3 }}
                            >
                                {isSubmitting
                                    ? 'Envoi en cours…'
                                    : allAnswered
                                      ? 'Terminer et envoyer'
                                      : `${String(answeredCount)} / ${String(totalQuestions)} réponses`}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                disableElevation
                                endIcon={<ArrowRight size={16} />}
                                onClick={goNext}
                                sx={{ borderRadius: 3 }}
                            >
                                Suivant
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ParticipantTestSessionRoute() {
    const navigate = useNavigate();
    const toast = useToast();
    const params = Route.useParams();
    const questionnaireCode = normalizeCode(params.questionnaireCode);

    const { data: session } = useParticipantSession();
    const { assignment: activeAssignment } = useSelectedAssignment(session);
    const campaignId = activeAssignment?.campaign_id ?? undefined;

    const { data: detail, isLoading, isError } = useQuestionnaire(questionnaireCode, { enabled: !!questionnaireCode });
    const submitMutation = useSubmitParticipantQuestionnaire(questionnaireCode, campaignId);
    const draftQuery = useElementBDraft(questionnaireCode, campaignId);
    const upsertDraft = useUpsertElementBDraft(questionnaireCode, campaignId);

    const [answers, setAnswers] = React.useState<AnswersMap>({});
    const [seriesIndex, setSeriesIndex] = React.useState(0);
    const [questionIndex, setQuestionIndex] = React.useState(0);
    /**
     * `null` tant qu'on n'a pas hydraté depuis le brouillon (ou conclu qu'il n'y en
     * avait pas). Évite que les hooks réécrivent la position du participant à chaque
     * re-render. On stocke `last_saved_at` pour invalider en cas de changement
     * (peu probable, mais correct).
     */
    const hydratedFromKeyRef = React.useRef<string | null>(null);

    const seriesCount = detail?.questions.series.length ?? 0;
    const questionCount = detail?.questions.series[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;

    const handleAnswer = (key: string, value: number) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    /**
     * Hydratation : applique le brouillon serveur dans le state local **une seule fois**
     * par identité de brouillon. Sans cette garde, chaque re-render réinitialiserait
     * la progression du participant (et écraserait les réponses qu'il vient de saisir).
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

    /**
     * Sauvegarde le brouillon de la série qui vient d'être complétée.
     * - Appelée uniquement par `handleSeriesIndexChange` quand on quitte vers l'avant.
     * - Si la série n'est pas intégralement remplie, on ne fait rien (cas attendu : la
     *   navigation vers la série suivante est de toute façon refusée par la garde
     *   `nextDisabled` côté QuestionCard, mais on durcit ici).
     * - Erreurs réseau silencieuses : pas d'alerte bloquante (on ne veut pas casser
     *   l'expérience utilisateur si l'autosave échoue, juste ne pas afficher le
     *   "brouillon enregistré").
     */
    const persistSeriesAsDraft = React.useCallback(
        async (completedSeriesIndex: number) => {
            if (typeof campaignId !== 'number') return;
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
        [answers, campaignId, questionCount, upsertDraft, toast]
    );

    const handleSeriesIndexChange = (next: number) => {
        // Avance de série N à N+1 → autosave de la série N qui vient d'être complétée.
        // Sur retour arrière, pas d'autosave (la série N+1 n'est pas censée être complète).
        if (next > seriesIndex) {
            void persistSeriesAsDraft(seriesIndex);
        }
        setSeriesIndex(next);
    };

    const handleDevFill = () => {
        const filled: Record<string, number> = {};
        for (let s = 0; s < seriesCount; s++) {
            for (let q = 0; q < questionCount; q++) {
                filled[answerKey(s, q)] = Math.floor(Math.random() * (ANSWER_MAX));
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
        toast.success('Test soumis avec succès ! Redirection vers vos résultats…');
        setTimeout(() => {
            // Après validation d'une étape du parcours, retour systématique sur la fiche
            // de la campagne concernée (cf. P10 du suivi produit 2026-05-02). Le participant
            // accède aux résultats depuis la fiche, pas en passant directement par eux.
            if (campaignId !== undefined) {
                navigate({
                    to: '/campaigns/$campaignId',
                    params: { campaignId: String(campaignId) },
                });
            } else {
                navigate({ to: '/campaigns' });
            }
        }, 1500);
    };

    if (isLoading) return <LoadingState />;
    if (isError || !detail) return <ErrorState />;

    if (activeAssignment?.progression?.element_humain_status === 'completed') {
        return (
            <StepCompletedBanner
                title="Test Élément Humain déjà soumis"
                description="Vous avez complété le test. Pour préserver l'intégrité du parcours, vos réponses ne peuvent plus être modifiées."
            />
        );
    }

    if (activeAssignment && activeAssignment.campaign_status !== 'active') {
        return <CampaignNotActiveBlock campaignId={activeAssignment.campaign_id} />;
    }

    const Icon = questionnaireCode === 'B' ? Users : questionnaireCode === 'F' ? Heart : Sparkles;
    const safeSeriesLabels = detail.questions.series_labels ?? [];
    const effectiveSeriesLabels =
        safeSeriesLabels.length > 0
            ? safeSeriesLabels
            : detail.questions.series.map((_, index) => `Série ${String(index + 1)}`);

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
                                label="Test Élément Humain"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {detail.title}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                {detail.description}
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
                                        <Icon size={20} />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={800} color="text.primary">
                                            Questionnaire de la campagne
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {questionnaireCode} · {effectiveSeriesLabels[0] ?? 'Série 1'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </CardContent>
            </Card>

            <Stack spacing={2.5}>
                {/* @ts-expect-error Vite injects import.meta.env at build time */}
                {import.meta.env.DEV && (
                    <Alert
                        severity="info"
                        action={
                            <Button color="inherit" size="small" onClick={handleDevFill}>
                                Remplir tout
                            </Button>
                        }
                    >
                        Mode développement — remplir les {totalQuestions} réponses automatiquement.
                    </Alert>
                )}
                <QuestionCard
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
        </Stack>
    );
}
