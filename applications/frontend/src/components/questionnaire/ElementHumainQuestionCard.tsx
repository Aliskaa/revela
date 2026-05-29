// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@/components/common/Button';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { RatingScale } from '@/components/questionnaire/RatingScale';
import { type AnswersMap, answerKey } from '@/components/questionnaire/elementHumainAnswers';
import { ELEMENT_HUMAIN_LIKERT } from '@/components/questionnaire/questionnaireScales';
import type { Question } from '@aor/types';
import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react';

const ANSWER_MIN = ELEMENT_HUMAIN_LIKERT.min;
const ANSWER_MAX = ELEMENT_HUMAIN_LIKERT.max;

export type ElementHumainQuestionCardProps = {
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
};

/**
 * Carte de saisie d'une question du test Élément Humain : navigation séquentielle
 * (série / question), échelle Likert, autosave et bouton de soumission finale.
 */
export function ElementHumainQuestionCard({
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
}: ElementHumainQuestionCardProps) {
    const seriesCount = questions.length;
    const questionCount = questions[0]?.length ?? 0;
    const totalQuestions = seriesCount * questionCount;

    const currentQuestion = questions[seriesIndex]?.[questionIndex];
    const currentLabel = seriesLabels[seriesIndex] ?? `Série ${String(seriesIndex + 1)}`;
    const currentStep = seriesIndex * questionCount + questionIndex + 1;
    const prevDisabled = seriesIndex === 0 && questionIndex === 0;
    const isLastQuestion = seriesIndex === seriesCount - 1 && questionIndex === questionCount - 1;

    const currentKey = answerKey(seriesIndex, questionIndex);
    const currentAnswer = answers[currentKey] ?? null;

    const answeredCount = Object.values(answers).filter(v => v !== null).length;
    const allAnswered = answeredCount === totalQuestions;
    const canGoNext = currentAnswer !== null;

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

    if (!currentQuestion) {
        return null;
    }

    return (
        <Card variant="outlined" sx={surfaceCardSx}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
                            >
                                Série {seriesIndex + 1} / {seriesCount} · {currentLabel}
                            </Typography>
                            <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mt: 0.35 }}>
                                Question {currentStep} / {totalQuestions}
                            </Typography>
                        </Box>
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
                                    flex: 'none',
                                }}
                            />
                        )}
                    </Stack>

                    <Box sx={{ borderRadius: 2, bgcolor: 'surface.lavenderGrey', p: { xs: 2, md: 2.5 } }}>
                        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.55 }}>
                            {currentQuestion.question}
                        </Typography>
                    </Box>

                    <Box sx={{ border: '1px solid', borderColor: 'border', borderRadius: 2, p: 2 }}>
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
                                        fontWeight: 700,
                                        bgcolor: currentAnswer !== null ? 'tint.primaryBg' : 'tint.secondaryBg',
                                        color: currentAnswer !== null ? 'primary.main' : 'tint.secondaryText',
                                    }}
                                />
                            </Stack>
                            <RatingScale
                                value={currentAnswer}
                                onChange={v => {
                                    if (v !== null) onAnswer(currentKey, v);
                                }}
                                max={ANSWER_MAX}
                                min={ANSWER_MIN}
                                endpointLabels={ELEMENT_HUMAIN_LIKERT.endpointLabels}
                                ariaLabel={currentQuestion.question}
                            />
                        </Stack>
                    </Box>

                    {submitError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            Une erreur est survenue lors de la soumission. Veuillez réessayer.
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                            appearance="secondary"
                            startIcon={<ArrowLeft size={16} />}
                            disabled={prevDisabled}
                            onClick={goPrev}
                        >
                            Précédent
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {isLastQuestion ? (
                            <Button
                                appearance="primary"
                                startIcon={<Send size={16} />}
                                disabled={!allAnswered || isSubmitting}
                                onClick={onSubmit}
                            >
                                {isSubmitting ? 'Envoi en cours…' : 'Terminer et envoyer'}
                            </Button>
                        ) : (
                            <Button
                                appearance="primary"
                                endIcon={<ArrowRight size={16} />}
                                disabled={!canGoNext}
                                onClick={goNext}
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
