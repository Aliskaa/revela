import type { QuestionnaireDetail } from '@aor/types';
import { AiPlaceholder } from '@/components/common/AiPlaceholder';
import { ScaleInput } from '@/components/common/ScaleInput';
import { ScientificProgressBar } from '@/components/common/ScientificProgressBar';
import { useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import { aorPrimaryButtonSx, invalidateParticipantSessionQueries } from './helpers';

type ScientificStep = 'series0' | 'transition' | 'series1';

type ScientificTestStepProps = {
    qid: string;
    q: QuestionnaireDetail;
    campaignId: number | null;
};

export function ScientificTestStep({ qid, q, campaignId }: ScientificTestStepProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const submit = useSubmitParticipantQuestionnaire(qid, campaignId);

    const n = q.questions.series[0].length;

    const [step, setStep] = useState<ScientificStep>('series0');
    const [currentQ, setCurrentQ] = useState(0);
    const [series0, setSeries0] = useState<(number | null)[]>(() => Array.from({ length: n }, () => null));
    const [series1, setSeries1] = useState<(number | null)[]>(() => Array.from({ length: n }, () => null));

    const currentAnswer = step === 'series0' ? series0[currentQ] : step === 'series1' ? series1[currentQ] : null;

    const answeredCount = useMemo(
        () => series0.filter(x => x !== null).length + series1.filter(x => x !== null).length,
        [series0, series1]
    );
    const progressPct = n > 0 ? (answeredCount / (2 * n)) * 100 : 0;

    const setAnswerForCurrent = (v: number) => {
        if (step === 'series0') {
            setSeries0(prev => {
                const next = [...prev];
                next[currentQ] = v;
                return next;
            });
            return;
        }
        if (step === 'series1') {
            setSeries1(prev => {
                const next = [...prev];
                next[currentQ] = v;
                return next;
            });
        }
    };

    const goNext = () => {
        if (step === 'series0') {
            if (series0[currentQ] === null) return;
            if (currentQ < n - 1) {
                setCurrentQ(c => c + 1);
            } else {
                setStep('transition');
                setCurrentQ(0);
            }
            return;
        }
        if (step === 'transition') {
            setStep('series1');
            return;
        }
        if (series1[currentQ] === null) return;
        if (currentQ < n - 1) {
            setCurrentQ(c => c + 1);
            return;
        }
        const s0 = series0.every(x => x !== null) ? (series0 as number[]) : null;
        const s1 = series1.every(x => x !== null) ? (series1 as number[]) : null;
        if (!s0 || !s1) return;
        submit.mutate(
            { series0: s0, series1: s1 },
            {
                onSuccess: () => {
                    invalidateParticipantSessionQueries(queryClient);
                    navigate({ to: '/participant' });
                },
            }
        );
    };

    const goPrev = () => {
        if (step === 'series0') {
            if (currentQ > 0) setCurrentQ(c => c - 1);
            return;
        }
        if (step === 'transition') {
            setStep('series0');
            setCurrentQ(n - 1);
            return;
        }
        if (currentQ > 0) {
            setCurrentQ(c => c - 1);
        } else {
            setStep('transition');
        }
    };

    const nextDisabled = submit.isPending || (step !== 'transition' && currentAnswer === null);
    const nextLabel = step === 'series1' && currentQ === n - 1 && series1[currentQ] !== null ? 'Envoyer' : 'Suivant';

    const totalItems = 2 * n;
    const questionOrdinal = step === 'series0' ? currentQ + 1 : step === 'series1' ? n + currentQ + 1 : n;
    const seriesTag =
        step === 'series0' ? q.questions.series_labels[0] : step === 'series1' ? q.questions.series_labels[1] : '';

    return (
        <Box>
            <ScientificProgressBar valuePct={progressPct} />

            {submit.isError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {submit.error.message}
                </Alert>
            )}

            {step === 'series0' && (
                <QuestionCardStep
                    question={q.questions.series[0][currentQ].question}
                    questionOrdinal={questionOrdinal}
                    totalItems={totalItems}
                    seriesTag={seriesTag}
                    currentAnswer={currentAnswer}
                    nextDisabled={nextDisabled}
                    onAnswerChange={setAnswerForCurrent}
                    onNext={goNext}
                    onPrev={goPrev}
                    prevDisabled={currentQ === 0 || submit.isPending}
                    nextLabel="Suivant"
                />
            )}

            {step === 'transition' && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
                        Première série terminée
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                        Vous enchaînez avec la seconde série. Prenez un instant si besoin, puis continuez.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                        <Button
                            startIcon={<ArrowLeft size={16} />}
                            onClick={goPrev}
                            disabled={submit.isPending}
                            sx={{ color: 'primary.main', fontWeight: 700 }}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<ArrowRight size={16} />}
                            onClick={goNext}
                            disabled={submit.isPending}
                            sx={aorPrimaryButtonSx}
                        >
                            Continuer
                        </Button>
                    </Box>
                </Box>
            )}

            {step === 'series1' && (
                <Box>
                    <QuestionCardStep
                        question={q.questions.series[1][currentQ].question}
                        questionOrdinal={questionOrdinal}
                        totalItems={totalItems}
                        seriesTag={seriesTag}
                        currentAnswer={currentAnswer}
                        nextDisabled={nextDisabled}
                        onAnswerChange={setAnswerForCurrent}
                        onNext={goNext}
                        onPrev={goPrev}
                        prevDisabled={submit.isPending}
                        nextLabel={nextLabel}
                        submitPending={submit.isPending}
                    />
                    <AiPlaceholder title="Analyse croisée IA (Théorie vs. pratique - placeholder)" fullWidth>
                        Exemple de rendu : vos réponses au test pourront être comparées à vos auto-évaluations et aux
                        retours pairs lorsque ces données seront disponibles. Aucun moteur IA n&apos;est connecté pour
                        l&apos;instant.
                    </AiPlaceholder>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, mb: 2 }}>
                        <AiPlaceholder title="Insight IA">
                            Espace réservé pour un texte dynamique (synthèses de parcours, messages de coaching).
                        </AiPlaceholder>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

type QuestionCardStepProps = {
    question: string;
    questionOrdinal: number;
    totalItems: number;
    seriesTag: string;
    currentAnswer: number | null;
    nextDisabled: boolean;
    prevDisabled: boolean;
    nextLabel: string;
    submitPending?: boolean;
    onAnswerChange: (v: number) => void;
    onNext: () => void;
    onPrev: () => void;
};

function QuestionCardStep({
    question,
    questionOrdinal,
    totalItems,
    seriesTag,
    currentAnswer,
    nextDisabled,
    prevDisabled,
    nextLabel,
    submitPending = false,
    onAnswerChange,
    onNext,
    onPrev,
}: QuestionCardStepProps) {
    return (
        <Box>
            <Typography
                variant="overline"
                sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: '0.12em', display: 'block', mb: 1 }}
            >
                Question {questionOrdinal} sur {totalItems} ({seriesTag})
            </Typography>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 3,
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                    mb: 3,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.45, mb: 3 }}>
                    {question}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                        px: { xs: 0, sm: 2 },
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Pas d&apos;accord
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        D&apos;accord
                    </Typography>
                </Box>
                <ScaleInput value={currentAnswer} onChange={onAnswerChange} />
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Button
                    startIcon={<ArrowLeft size={16} />}
                    onClick={onPrev}
                    disabled={prevDisabled}
                    sx={{ color: 'primary.main', fontWeight: 700 }}
                >
                    Précédent
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={
                        submitPending || nextLabel !== 'Envoyer' ? <ArrowRight size={16} /> : <Sparkles size={18} />
                    }
                    onClick={onNext}
                    disabled={nextDisabled}
                    sx={aorPrimaryButtonSx}
                >
                    {submitPending ? 'Envoi...' : nextLabel === 'Envoyer' ? 'Valider ma réponse' : nextLabel}
                </Button>
            </Box>
        </Box>
    );
}
