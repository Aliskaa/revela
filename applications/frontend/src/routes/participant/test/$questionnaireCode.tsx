import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    CircleDot,
    Clock3,
    Hash,
    Heart,
    Loader2,
    Save,
    Sparkles,
    Users,
} from 'lucide-react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import { useQuestionnaire } from '@/hooks/questionnaires';
import { RatingScale } from '@/components/questionnaire/RatingScale';
import { InfoCard } from '@/components/common/InfoCard';
import type { Question } from '@aor/types';

export const Route = createFileRoute('/participant/test/$questionnaireCode')({
    component: ParticipantTestSessionRoute,
});

function normalizeCode(value: string | undefined): string {
    return value?.trim().toUpperCase() || 'B';
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                {title}
            </Typography>
            {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    );
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

function buildQuestionLabel(question: Question, _questionnaireCode: string): string {
    return question.question;
}

function QuestionCard({
    questionnaireCode,
    seriesLabels,
    questions,
}: {
    questionnaireCode: string;
    seriesLabels: string[];
    questions: Question[][];
}) {
    const seriesCount = questions.length;
    const questionCount = questions[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;

    const [seriesIndex, setSeriesIndex] = React.useState(0);
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const [answer, setAnswer] = React.useState<number | null>(null);
    const [answers, setAnswers] = React.useState<Record<string, number | null>>({});

    const currentQuestion = questions[seriesIndex]?.[questionIndex];
    const currentLabel = seriesLabels[seriesIndex] ?? `Série ${seriesIndex + 1}`;
    const currentStep = seriesIndex * questionCount + questionIndex + 1;
    const progress = totalQuestions > 0 ? Math.round((currentStep / totalQuestions) * 100) : 0;
    const prevDisabled = seriesIndex === 0 && questionIndex === 0;
    const nextDisabled = seriesIndex === seriesCount - 1 && questionIndex === questionCount - 1;

    const currentKey = `${seriesIndex}-${questionIndex}`;

    React.useEffect(() => {
        setAnswer(answers[currentKey] ?? null);
    }, [currentKey]);

    const persistAnswer = () => {
        setAnswers(prev => ({ ...prev, [currentKey]: answer }));
    };

    const goNext = () => {
        persistAnswer();
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
        persistAnswer();
        if (questionIndex > 0) {
            setQuestionIndex(v => v - 1);
            return;
        }
        if (seriesIndex > 0) {
            setSeriesIndex(v => v - 1);
            setQuestionIndex(questionCount - 1);
        }
    };

    if (!currentQuestion) {
        return null;
    }

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2} flexWrap="wrap">
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
                        <Chip label={`${progress}%`} size="small" sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }} />
                    </Stack>

                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 99, bgcolor: 'tint.subtleBg', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />

                    <Box sx={{ borderRadius: 5, bgcolor: 'rgba(15,23,42,0.03)', p: 2.2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Question actuelle
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                            {buildQuestionLabel(currentQuestion, questionnaireCode)}
                        </Typography>
                    </Box>

                    <Box sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 2 }}>
                        <Stack spacing={1.2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                <Typography variant="body2" fontWeight={700} color="text.primary">
                                    Réponse de 1 à 9
                                </Typography>
                                <Chip label={answer ?? '—'} size="small" sx={{ borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }} />
                            </Stack>
                            <RatingScale value={answer} onChange={setAnswer} />
                        </Stack>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} disabled={prevDisabled} onClick={goPrev} sx={{ borderRadius: 3 }}>
                            Précédent
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {nextDisabled ? (
                            <Button variant="contained" disableElevation component={Link} to="/participant/results" startIcon={<Save size={16} />} sx={{ borderRadius: 3 }}>
                                Terminer et voir les résultats
                            </Button>
                        ) : (
                            <Button variant="contained" disableElevation endIcon={<ArrowRight size={16} />} onClick={goNext} sx={{ borderRadius: 3 }}>
                                Suivant
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

function SidebarSummary({ questionnaireCode, seriesLabels }: { questionnaireCode: string; seriesLabels: string[] }) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Résumé" subtitle="Ce test est lié à la campagne et ne se choisit pas ici." />
                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.4}>
                    <InfoCard icon={BadgeCheck} label="Questionnaire" value={questionnaireCode} variant="border" />
                    <InfoCard icon={CircleDot} label="Séries" value={String(seriesLabels.length)} variant="border" />
                    <InfoCard icon={Hash} label="Questions" value="54 par série" variant="border" />
                    <InfoCard icon={Clock3} label="Durée" value="Variable selon le rythme" variant="border" />
                </Stack>
            </CardContent>
        </Card>
    );
}

function ParticipantTestSessionRoute() {
    const params = Route.useParams();
    const questionnaireCode = normalizeCode(params.questionnaireCode);
    const { data: detail, isLoading, isError } = useQuestionnaire(questionnaireCode, { enabled: !!questionnaireCode });

    if (isLoading) return <LoadingState />;
    if (isError || !detail) return <ErrorState />;

    const Icon = questionnaireCode === 'B' ? Users : questionnaireCode === 'F' ? Heart : Sparkles;
    const safeSeriesLabels = detail.questions.series_labels ?? [];
    const effectiveSeriesLabels = safeSeriesLabels.length > 0 ? safeSeriesLabels : detail.questions.series.map((_, index) => `Série ${index + 1}`);

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5} direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', lg: 'start' }}>
                        <Box>
                            <Chip label="Test Élément Humain" sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }} />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {detail.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                                {detail.description}
                            </Typography>
                        </Box>

                        <Card variant="outlined" sx={{ width: { xs: '100%', sm: 340 } }}>
                            <CardContent sx={{ p: 2 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}>
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
                <InfoCard icon={BadgeCheck} label="Questionnaire actif" value={questionnaireCode} variant="border" />
                <InfoCard icon={CircleDot} label="Séries" value={String(detail.questions.series.length)} variant="border" />
                <InfoCard icon={Hash} label="Questions" value={`${detail.questions.series[0]?.length ?? 0} / série`} variant="border" />
                <InfoCard icon={Sparkles} label="Étape" value="Test" variant="border" />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' }, gap: 3, alignItems: 'start' }}>
                <Stack spacing={2.5}>
                    <QuestionCard questionnaireCode={questionnaireCode} seriesLabels={effectiveSeriesLabels} questions={detail.questions.series} />

                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Dimensions du questionnaire" subtitle="La structure dépend du questionnaire de la campagne." />
                            <Stack spacing={1.2} sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(detail.result_dims.length, 3)}, minmax(0, 1fr))` }, gap: 1.2 }}>
                                {detail.result_dims.map(dimension => (
                                    <Box key={dimension.name} sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Dimension
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
                                            {dimension.name}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                <Stack spacing={2.5}>
                    <SidebarSummary questionnaireCode={questionnaireCode} seriesLabels={effectiveSeriesLabels} />

                    <Card variant="outlined">
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Actions" subtitle="Sauvegarder la réponse ou revenir au flux." />
                            <Stack spacing={1.2} sx={{ mt: 2 }}>
                                <Button variant="contained" disableElevation startIcon={<Save size={16} />} sx={{ borderRadius: 3 }}>
                                    Enregistrer la réponse
                                </Button>
                                <Button variant="outlined" component={Link} to="/participant/test" sx={{ borderRadius: 3 }}>
                                    Retour au questionnaire de campagne
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Stack>
    );
}
