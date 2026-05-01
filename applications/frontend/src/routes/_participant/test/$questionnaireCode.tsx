import * as React from 'react';

import { StatCard } from '@/components/common/cards';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { RatingScale } from '@/components/questionnaire/RatingScale';
import { useParticipantSession } from '@/hooks/participantSession';
import { useQuestionnaire, useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { useSelectedAssignment } from '@/hooks/useSelectedAssignment';
import type { Question } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    CircleDot,
    Clock3,
    Hash,
    Heart,
    Loader2,
    Send,
    Sparkles,
    Users,
} from 'lucide-react';

export const Route = createFileRoute('/_participant/test/$questionnaireCode')({
    component: ParticipantTestSessionRoute,
});

const QUESTIONS_PER_SERIES = 54;
const ANSWER_MIN = 0;
const ANSWER_MAX = 5;

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

function QuestionCard({
    seriesLabels,
    questions,
    answers,
    onAnswer,
    onSubmit,
    isSubmitting,
    submitError,
}: {
    seriesLabels: string[];
    questions: Question[][];
    answers: Record<string, number | null>;
    onAnswer: (key: string, value: number) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    submitError: boolean;
}) {
    const seriesCount = questions.length;
    const questionCount = questions[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;

    const [seriesIndex, setSeriesIndex] = React.useState(0);
    const [questionIndex, setQuestionIndex] = React.useState(0);

    const currentQuestion = questions[seriesIndex]?.[questionIndex];
    const currentLabel = seriesLabels[seriesIndex] ?? `Série ${String(seriesIndex + 1)}`;
    const currentStep = seriesIndex * questionCount + questionIndex + 1;
    const progress = totalQuestions > 0 ? Math.round((currentStep / totalQuestions) * 100) : 0;
    const prevDisabled = seriesIndex === 0 && questionIndex === 0;
    const isLastQuestion = seriesIndex === seriesCount - 1 && questionIndex === questionCount - 1;

    const currentKey = `${String(seriesIndex)}-${String(questionIndex)}`;
    const currentAnswer = answers[currentKey] ?? null;

    const answeredCount = Object.values(answers).filter(v => v !== null).length;
    const allAnswered = answeredCount === totalQuestions;

    const goNext = () => {
        if (questionIndex < questionCount - 1) {
            setQuestionIndex(v => v + 1);
            return;
        }
        if (seriesIndex < seriesCount - 1) {
            setSeriesIndex(v => v + 1);
            setQuestionIndex(0);
        }
    };

    const goPrev = () => {
        if (questionIndex > 0) {
            setQuestionIndex(v => v - 1);
            return;
        }
        if (seriesIndex > 0) {
            setSeriesIndex(v => v - 1);
            setQuestionIndex(questionCount - 1);
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
                                    Pas d'accord → D'accord
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
                                max={ANSWER_MAX + 1}
                                min={ANSWER_MIN}
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

function SidebarSummary({
    questionnaireCode,
    seriesLabels,
    answeredCount,
    totalQuestions,
}: {
    questionnaireCode: string;
    seriesLabels: string[];
    answeredCount: number;
    totalQuestions: number;
}) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={800} color="text.primary">
                    Résumé
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Ce test est lié à la campagne et ne se choisit pas ici.
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.4}>
                    <StatCard
                        variant="compact"
                        icon={BadgeCheck}
                        label="Questionnaire"
                        value={questionnaireCode}
                        frame="box"
                    />
                    <StatCard
                        variant="compact"
                        icon={CircleDot}
                        label="Séries"
                        value={String(seriesLabels.length)}
                        frame="box"
                    />
                    <StatCard
                        variant="compact"
                        icon={Hash}
                        label="Questions"
                        value={`${String(QUESTIONS_PER_SERIES)} par série`}
                        frame="box"
                    />
                    <StatCard
                        variant="compact"
                        icon={Clock3}
                        label="Progression"
                        value={`${String(answeredCount)} / ${String(totalQuestions)}`}
                        frame="box"
                    />
                </Stack>
            </CardContent>
        </Card>
    );
}

function ParticipantTestSessionRoute() {
    const navigate = useNavigate();
    const params = Route.useParams();
    const questionnaireCode = normalizeCode(params.questionnaireCode);

    const { data: session } = useParticipantSession();
    const { assignment: activeAssignment } = useSelectedAssignment(session);
    const campaignId = activeAssignment?.campaign_id ?? undefined;

    const { data: detail, isLoading, isError } = useQuestionnaire(questionnaireCode, { enabled: !!questionnaireCode });
    const submitMutation = useSubmitParticipantQuestionnaire(questionnaireCode, campaignId);

    const [answers, setAnswers] = React.useState<Record<string, number | null>>({});
    const [successOpen, setSuccessOpen] = React.useState(false);

    const handleAnswer = (key: string, value: number) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const seriesCount = detail?.questions.series.length ?? 0;
    const questionCount = detail?.questions.series[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;
    const answeredCount = Object.values(answers).filter(v => v !== null).length;

    const handleDevFill = () => {
        const filled: Record<string, number> = {};
        for (let s = 0; s < seriesCount; s++) {
            for (let q = 0; q < questionCount; q++) {
                filled[`${String(s)}-${String(q)}`] = Math.floor(Math.random() * (ANSWER_MAX + 1));
            }
        }
        setAnswers(filled);
    };

    const handleSubmit = async () => {
        if (!detail) return;

        const series0: number[] = [];
        const series1: number[] = [];

        for (let q = 0; q < questionCount; q++) {
            const v0 = answers[`0-${String(q)}`];
            if (v0 === null || v0 === undefined) return;
            series0.push(v0);
        }

        if (seriesCount > 1) {
            for (let q = 0; q < questionCount; q++) {
                const v1 = answers[`1-${String(q)}`];
                if (v1 === null || v1 === undefined) return;
                series1.push(v1);
            }
        }

        await submitMutation.mutateAsync({ series0, series1 });
        setSuccessOpen(true);
        setTimeout(() => {
            if (campaignId !== undefined) {
                navigate({
                    to: '/campaigns/$campaignId/results',
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    variant="compact"
                    icon={BadgeCheck}
                    label="Questionnaire actif"
                    value={questionnaireCode}
                    frame="box"
                />
                <StatCard
                    variant="compact"
                    icon={CircleDot}
                    label="Séries"
                    value={String(detail.questions.series.length)}
                    frame="box"
                />
                <StatCard
                    variant="compact"
                    icon={Hash}
                    label="Questions"
                    value={`${String(detail.questions.series[0]?.length ?? 0)} / série`}
                    frame="box"
                />
                <StatCard variant="compact" icon={Sparkles} label="Étape" value="Test" frame="box" />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
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
                        seriesLabels={effectiveSeriesLabels}
                        questions={detail.questions.series}
                        answers={answers}
                        onAnswer={handleAnswer}
                        onSubmit={handleSubmit}
                        isSubmitting={submitMutation.isPending}
                        submitError={submitMutation.isError}
                    />

                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                Dimensions du questionnaire
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                La structure dépend du questionnaire de la campagne.
                            </Typography>
                            <Stack
                                spacing={1.2}
                                sx={{
                                    mt: 2,
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        md: `repeat(${Math.min(detail.result_dims.length, 3)}, minmax(0, 1fr))`,
                                    },
                                    gap: 1.2,
                                }}
                            >
                                {detail.result_dims.map(dimension => (
                                    <Box
                                        key={dimension.name}
                                        sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.5 }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            Dimension
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            color="text.primary"
                                            sx={{ mt: 0.25 }}
                                        >
                                            {dimension.name}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                <SidebarSummary
                    questionnaireCode={questionnaireCode}
                    seriesLabels={effectiveSeriesLabels}
                    answeredCount={answeredCount}
                    totalQuestions={totalQuestions}
                />
            </Box>

            <Snackbar
                open={successOpen}
                autoHideDuration={3000}
                onClose={() => setSuccessOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                message="Test soumis avec succès ! Redirection vers vos résultats…"
            />
        </Stack>
    );
}
