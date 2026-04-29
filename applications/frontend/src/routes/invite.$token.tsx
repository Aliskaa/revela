import { ScaleInput } from '@/components/common/ScaleInput';
import { useActivateInvite, useConfirmInviteParticipation, useInvite, useSubmitInvite } from '@/hooks/invitations';
import { useQuestionnaire } from '@/hooks/questionnaires';
import { parseParticipantJwtParticipantId, userParticipant } from '@/lib/auth';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, CheckCircle, Lock, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/invite/$token')({
    component: InvitePage,
});

type Step = 'welcome' | 'series0' | 'transition' | 'series1' | 'submitting';

// Styles réutilisables pour la page d'invitation
const aorBtnSx = {
    py: 1.2,
    px: 3,
    borderRadius: 2,
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(21, 21, 176, 0.25)',
};

const aorPaperSx = {
    p: { xs: 3, md: 5 },
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 12px 40px rgba(21, 21, 176, 0.05)',
    bgcolor: 'background.paper',
};

function InvitePage() {
    const { token } = Route.useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const { data: invite, isLoading: loadingInvite, error: inviteError } = useInvite(token);

    const qid = invite?.questionnaire_id ?? '';
    const needsActivation = invite?.needs_activation === true;
    const needsParticipationConfirmation = invite?.needs_participation_confirmation === true;
    const campaignBlocksFilling =
        invite != null &&
        invite.campaign_id != null &&
        (invite.campaign_status == null || invite.campaign_status !== 'active');

    const canShowQuestionnaire =
        Boolean(qid) &&
        Boolean(invite) &&
        !needsParticipationConfirmation &&
        !needsActivation &&
        !campaignBlocksFilling;

    const { data: q, isLoading: loadingQ } = useQuestionnaire(qid, {
        enabled: canShowQuestionnaire,
    });

    const submitInvite = useSubmitInvite(token);
    const activateInvite = useActivateInvite(token);
    const confirmParticipation = useConfirmInviteParticipation(token);

    const [step, setStep] = useState<Step>('welcome');
    const [series0, setSeries0] = useState<(number | null)[]>([]);
    const [series1, setSeries1] = useState<(number | null)[]>([]);
    const [currentQ, setCurrentQ] = useState(0);

    // Formulaires
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [activationError, setActivationError] = useState('');
    const [confirmError, setConfirmError] = useState('');

    const isLoading = loadingInvite || (canShowQuestionnaire && loadingQ);

    /** Participation campagne déjà confirmée : ne plus montrer le flux invite, renvoyer vers l'accueil. */
    useEffect(() => {
        if (loadingInvite || inviteError || !invite) return;
        const alreadyConfirmedCampaign =
            invite.campaign_id != null && invite.invitation_confirmed === true && invite.needs_activation !== true;
        if (alreadyConfirmedCampaign) {
            const jwtParticipantId = parseParticipantJwtParticipantId();
            if (jwtParticipantId !== null && jwtParticipantId !== invite.participant_id) {
                userParticipant.removeToken();
            }
            void navigate({ to: '/', replace: true });
        }
    }, [invite, inviteError, loadingInvite, navigate]);

    if (loadingInvite) {
        return (
            <Box sx={{ pt: 12, textAlign: 'center' }}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    if (inviteError || !invite) {
        const msg =
            (inviteError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Lien invalide ou expiré.';
        return (
            <Container maxWidth="sm" sx={{ pt: 10 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {msg}
                </Alert>
            </Container>
        );
    }

    // ── ÉTAPE 1 : CONFIRMATION DE PARTICIPATION ──────────────────────────────
    if (needsParticipationConfirmation) {
        const confirmInvite = invite;
        async function handleConfirmParticipation(e: React.FormEvent) {
            e.preventDefault();
            setConfirmError('');
            try {
                await confirmParticipation.mutateAsync();
                await navigate({ to: '/invite/$token', params: { token }, replace: true });
            } catch (err) {
                const ax = err as { response?: { data?: { error?: string } } };
                const apiError = ax?.response?.data?.error;
                setConfirmError(apiError ?? 'Impossible de confirmer votre participation. Réessayez plus tard.');
            }
        }

        return (
            <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
                <Paper sx={aorPaperSx} elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: 'rgba(21, 21, 176, 0.08)',
                                borderRadius: 2,
                                color: 'primary.main',
                                display: 'flex',
                            }}
                        >
                            <UserCheck size={24} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                            Confirmation
                        </Typography>
                    </Box>

                    <Stack
                        spacing={0.5}
                        mb={3}
                        p={2}
                        bgcolor="background.default"
                        borderRadius={2}
                        border="1px solid"
                        borderColor="divider"
                    >
                        <Typography variant="subtitle2" fontWeight={700}>
                            {confirmInvite.participant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {confirmInvite.participant.email}
                        </Typography>
                        {confirmInvite.participant.organisation && (
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                fontWeight={600}
                                textTransform="uppercase"
                                mt={0.5}
                            >
                                {confirmInvite.participant.organisation}
                            </Typography>
                        )}
                    </Stack>

                    <Typography variant="body1" color="text.secondary" mb={4} lineHeight={1.6}>
                        Vous avez été invité·e à rejoindre une campagne d'évaluation. Merci de confirmer votre
                        participation avant de poursuivre. Vous pourrez répondre aux questionnaires lorsque la campagne
                        sera activée par votre coach.
                    </Typography>

                    {confirmError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {confirmError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleConfirmParticipation}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={confirmParticipation.isPending}
                            endIcon={
                                confirmParticipation.isPending ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <ArrowRight size={18} />
                                )
                            }
                            sx={aorBtnSx}
                        >
                            {confirmParticipation.isPending ? 'Traitement…' : 'Je confirme ma participation'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // ── ÉTAPE 2 : CRÉATION DU MOT DE PASSE ──────────────────────────────────
    if (needsActivation) {
        const activationInvite = invite;
        async function handleActivate(e: React.FormEvent) {
            e.preventDefault();
            setActivationError('');
            if (password.length < 8) {
                setActivationError('Le mot de passe doit contenir au moins 8 caractères.');
                return;
            }
            if (password !== passwordConfirm) {
                setActivationError('Les mots de passe ne correspondent pas.');
                return;
            }
            try {
                await activateInvite.mutateAsync({ password });
                const status = activationInvite.campaign_status;
                const hasCampaign = activationInvite.campaign_id != null;
                const campaignOpen = !hasCampaign || status === 'active';

                if (campaignOpen) {
                    navigate({
                        to: '/self-rating',
                    });
                } else {
                    navigate({ to: '/', replace: true });
                }
            } catch (err) {
                const ax = err as { response?: { status?: number; data?: { error?: string } } };
                const status = ax?.response?.status;
                const apiError = ax?.response?.data?.error;
                if (apiError) {
                    setActivationError(apiError);
                } else if (status === 409) {
                    setActivationError('Ce compte est déjà activé. Connectez-vous depuis la page Connexion.');
                } else {
                    setActivationError(
                        "Impossible d'activer le compte. Vérifiez le lien ou contactez l'administrateur."
                    );
                }
            }
        }

        return (
            <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
                <Paper sx={aorPaperSx} elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                bgcolor: 'rgba(21, 21, 176, 0.08)',
                                borderRadius: 2,
                                color: 'primary.main',
                                display: 'flex',
                            }}
                        >
                            <ShieldCheck size={24} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                            Sécuriser le compte
                        </Typography>
                    </Box>

                    <Stack
                        spacing={0.5}
                        mb={3}
                        p={2}
                        bgcolor="background.default"
                        borderRadius={2}
                        border="1px solid"
                        borderColor="divider"
                    >
                        <Typography variant="subtitle2" fontWeight={700}>
                            {activationInvite.participant.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {activationInvite.participant.email}
                        </Typography>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.6}>
                        Choisissez un mot de passe pour vos prochaines connexions. Ce lien d'invitation ne sera plus
                        valide après cette étape.
                    </Typography>

                    {activationError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {activationError}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleActivate}
                        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                    >
                        <TextField
                            label="Créer un mot de passe"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            fullWidth
                            autoComplete="new-password"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            label="Confirmer le mot de passe"
                            type="password"
                            value={passwordConfirm}
                            onChange={e => setPasswordConfirm(e.target.value)}
                            fullWidth
                            autoComplete="new-password"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={activateInvite.isPending}
                            endIcon={
                                activateInvite.isPending ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <ArrowRight size={18} />
                                )
                            }
                            sx={{ ...aorBtnSx, mt: 1 }}
                        >
                            {activateInvite.isPending ? 'Activation en cours…' : 'Activer et accéder à mon espace'}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // ── ÉTAPE 3 : CAMPAGNE NON DÉMARRÉE ──────────────────────────────────────
    if (campaignBlocksFilling) {
        const waitInvite = invite;
        return (
            <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
                <Paper sx={aorPaperSx} elevation={0}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                bgcolor: 'background.default',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            <Lock size={28} style={{ color: theme.palette.text.disabled }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800} color="text.primary" mb={1}>
                            Campagne en préparation
                        </Typography>
                        <Typography color="text.secondary">
                            Bonjour <strong>{waitInvite.participant.name}</strong>, votre participation est validée.
                        </Typography>
                    </Box>
                    <Alert
                        severity="info"
                        sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500, lineHeight: 1.6 } }}
                    >
                        Cette campagne n'est pas encore ouverte aux réponses. Vous recevrez une notification ou pourrez
                        vous connecter lorsque votre coach l'aura activée.
                    </Alert>
                </Paper>
            </Container>
        );
    }

    if (isLoading)
        return (
            <Box sx={{ pt: 12, textAlign: 'center' }}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    if (!q) return null;

    // ── LOGIQUE DU QUESTIONNAIRE SCIENTIFIQUE ────────────────────────────────
    const totalQuestions = q.questions.series[0].length;
    const activeSeries = step === 'series0' ? series0 : series1;
    const setActiveSeries = step === 'series0' ? setSeries0 : setSeries1;
    const currentAnswer = step === 'series0' ? series0[currentQ] : series1[currentQ];
    const currentQuestion =
        step === 'series0' || step === 'series1' ? q.questions.series[step === 'series0' ? 0 : 1][currentQ] : null;

    // Calcul de la progression globale
    const progress =
        step === 'series0'
            ? 10 + (currentQ / totalQuestions) * 40
            : step === 'series1'
              ? 52 + (currentQ / totalQuestions) * 46
              : step === 'transition'
                ? 50
                : step === 'submitting'
                  ? 100
                  : 5;

    function handleAnswer(value: number) {
        const updated = [...activeSeries];
        updated[currentQ] = value;
        setActiveSeries(updated as number[]);
    }

    function handleNext() {
        if (currentQ < totalQuestions - 1) {
            setCurrentQ(currentQ + 1);
        } else if (step === 'series0') {
            setCurrentQ(0);
            setStep('transition');
        } else {
            handleSubmit();
        }
    }

    function handlePrev() {
        if (currentQ > 0) {
            setCurrentQ(currentQ - 1);
        } else if (step === 'series1') {
            setCurrentQ(totalQuestions - 1);
            setStep('series0');
        }
    }

    async function handleSubmit() {
        setStep('submitting');
        try {
            await submitInvite.mutateAsync({
                series0: series0 as number[],
                series1: series1 as number[],
            });
            navigate({ to: '/results' });
        } catch {
            setStep('series1');
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
            {/* Header du questionnaire */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Chip
                    label={`Type : ${q.id}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(21, 21, 176, 0.08)', color: 'primary.main', fontWeight: 800, mb: 1.5 }}
                />
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    {q.title}
                </Typography>

                {/* Barre de progression avec dégradé AOR */}
                <Box
                    sx={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        mt: 3,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${progress}%`,
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        }}
                    />
                </Box>
            </Box>

            {/* Écran de lancement */}
            {step === 'welcome' && (
                <Paper sx={aorPaperSx} elevation={0}>
                    <Typography variant="h5" fontWeight={800} color="primary.main" mb={1}>
                        Bonjour, {invite.participant.name.split(' ')[0]}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={4}>
                        Bienvenue dans votre espace d'évaluation.
                    </Typography>
                    <Typography
                        variant="body1"
                        mb={4}
                        sx={{
                            p: 2.5,
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            lineHeight: 1.6,
                        }}
                    >
                        {q.description}
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        endIcon={<ArrowRight size={18} />}
                        onClick={() => {
                            setSeries0(Array(totalQuestions).fill(null));
                            setSeries1(Array(totalQuestions).fill(null));
                            setCurrentQ(0);
                            setStep('series0');
                        }}
                        sx={aorBtnSx}
                    >
                        Commencer l'évaluation
                    </Button>
                </Paper>
            )}

            {/* Les Questions */}
            {(step === 'series0' || step === 'series1') && currentQuestion && (
                <Paper sx={aorPaperSx} elevation={0}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                            variant="overline"
                            color="secondary.main"
                            sx={{ fontWeight: 800, letterSpacing: '0.1em' }}
                        >
                            {q.questions.series_labels[step === 'series0' ? 0 : 1]}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} display="block" mt={-0.5}>
                            Question {currentQ + 1} sur {totalQuestions}
                        </Typography>
                    </Box>

                    <Typography
                        variant="h5"
                        fontWeight={700}
                        color="text.primary"
                        textAlign="center"
                        mb={5}
                        lineHeight={1.4}
                    >
                        {currentQuestion.question}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Pas d'accord
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            D'accord
                        </Typography>
                    </Box>

                    <ScaleInput value={currentAnswer ?? null} onChange={handleAnswer} />

                    <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                            startIcon={<ArrowLeft size={16} />}
                            onClick={handlePrev}
                            disabled={step === 'series0' && currentQ === 0}
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 600,
                                '&:hover': { bgcolor: 'background.default' },
                            }}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={
                                currentQ === totalQuestions - 1 && step === 'series1' ? (
                                    <Sparkles size={16} />
                                ) : (
                                    <ArrowRight size={16} />
                                )
                            }
                            onClick={handleNext}
                            disabled={currentAnswer === null || currentAnswer === undefined}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                        >
                            {currentQ === totalQuestions - 1 && step === 'series1' ? 'Terminer' : 'Suivant'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Transition entre les deux séries */}
            {step === 'transition' && (
                <Paper sx={{ ...aorPaperSx, textAlign: 'center' }} elevation={0}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            p: 2,
                            bgcolor: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '50%',
                            color: 'success.main',
                            mb: 2,
                        }}
                    >
                        <CheckCircle size={40} />
                    </Box>
                    <Typography variant="h5" fontWeight={800} color="text.primary" mb={1.5}>
                        Première série terminée
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={4}>
                        Passons à la deuxième partie : <strong>{q.questions.series_labels[1]}</strong>
                    </Typography>
                    <Button
                        variant="contained"
                        endIcon={<ArrowRight size={18} />}
                        onClick={() => {
                            setCurrentQ(0);
                            setStep('series1');
                        }}
                        sx={aorBtnSx}
                    >
                        Continuer
                    </Button>
                </Paper>
            )}

            {/* Traitement final */}
            {step === 'submitting' && (
                <Paper sx={{ ...aorPaperSx, textAlign: 'center', py: 8 }} elevation={0}>
                    <CircularProgress size={48} thickness={4} sx={{ mb: 3 }} />
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                        Analyse de vos réponses…
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        Génération de votre profil en cours.
                    </Typography>
                </Paper>
            )}
        </Container>
    );
}
