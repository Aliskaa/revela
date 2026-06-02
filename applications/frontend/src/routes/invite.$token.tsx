// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ScaleInput } from '@/components/common/ScaleInput';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/layout';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { PublicRevelaPageShell } from '@/components/layout/PublicRevelaPageShell';
import { useActivateInvite, useConfirmInviteParticipation, useInvite, useSubmitInvite } from '@/hooks/invitations';
import { useQuestionnaire } from '@/hooks/questionnaires';
import { parseParticipantJwtParticipantId, userParticipant } from '@/lib/auth';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    FormControlLabel,
    Link as MuiLink,
    Stack,
    TextField,
    Typography,
    type SxProps,
    type Theme,
} from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, CheckCircle, Lock, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/invite/$token')({
    component: InvitePage,
});

type Step = 'welcome' | 'series0' | 'transition' | 'series1' | 'submitting';

function InvitePage() {
    const { token } = Route.useParams();
    const navigate = useNavigate();
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

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [activationError, setActivationError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [privacyConsent, setPrivacyConsent] = useState(false);

    const isLoading = loadingInvite || (canShowQuestionnaire && loadingQ);

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
            <PublicRevelaPageShell>
                <InviteCenteredState>
                    <CircularProgress size={48} thickness={4} />
                </InviteCenteredState>
            </PublicRevelaPageShell>
        );
    }

    if (inviteError || !invite) {
        const msg =
            (inviteError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            'Lien invalide ou expiré.';
        return (
            <PublicRevelaPageShell>
                <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {msg}
                    </Alert>
                </Container>
            </PublicRevelaPageShell>
        );
    }

    if (needsParticipationConfirmation) {
        const confirmInvite = invite;
        async function handleConfirmParticipation(e: React.FormEvent) {
            e.preventDefault();
            setConfirmError('');
            if (!privacyConsent) {
                setConfirmError(
                    'Vous devez accepter la politique de confidentialité avant de confirmer votre participation.'
                );
                return;
            }
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
            <PublicRevelaPageShell>
                <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Confirmation"
                            subtitle="Prenez connaissance du cadre de confidentialité avant de rejoindre votre parcours."
                        />

                        <InviteStepCard>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: 'tint.primaryBg',
                                        color: 'primary.main',
                                        display: 'grid',
                                        placeItems: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <UserCheck size={20} aria-hidden />
                                </Box>
                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                    Votre invitation
                                </Typography>
                            </Stack>

                            <InviteParticipantSummary
                                name={confirmInvite.participant.name}
                                email={confirmInvite.participant.email}
                                organisation={confirmInvite.participant.organisation}
                            />

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                Cet espace vous est proposé par le Cabinet AOR dans le cadre de votre parcours de
                                formation manager. Il vous permet de réaliser un travail de conscience de soi en trois
                                étapes : un regard sur vous-même, des feedbacks de vos pairs, et le questionnaire Élément
                                Humain.
                            </Typography>

                            <Alert
                                severity="info"
                                icon={<ShieldCheck size={20} />}
                                sx={{ mb: 3, borderRadius: 2, '& .MuiAlert-message': { lineHeight: 1.7 } }}
                            >
                                <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                                    Vos données vous appartiennent.
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Vos réponses sont strictement confidentielles et exclusivement destinées au formateur
                                    mandaté qui vous accompagne.
                                    <Box component="ul" sx={{ pl: 3, my: 1 }}>
                                        <li>Elles ne sont jamais transmises à votre employeur de manière nominative</li>
                                        <li>
                                            Vous pouvez à tout moment demander leur consultation, leur modification ou
                                            leur suppression définitive.
                                        </li>
                                    </Box>
                                    Consultez notre{' '}
                                    <MuiLink
                                        component={Link}
                                        to="/confidentiality"
                                        target="_blank"
                                        rel="noopener"
                                        underline="always"
                                    >
                                        politique de confidentialité
                                    </MuiLink>{' '}
                                    pour le détail des finalités, durée de conservation et de vos droits (accès, export,
                                    rectification, suppression). En cliquant sur « Je confirme ma participation », vous
                                    confirmez avoir pris connaissance des modalités de traitement de vos données
                                    personnelles et consentez librement à votre participation.
                                </Typography>
                            </Alert>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={privacyConsent}
                                        onChange={e => setPrivacyConsent(e.target.checked)}
                                        sx={{ alignSelf: 'flex-start', pt: 0 }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                        Je confirme ma participation à ce parcours.
                                    </Typography>
                                }
                                sx={{ alignItems: 'flex-start', mb: 3, mr: 0 }}
                            />

                            {confirmError ? (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {confirmError}
                                </Alert>
                            ) : null}

                            <Box component="form" onSubmit={handleConfirmParticipation}>
                                <Button
                                    type="submit"
                                    appearance="primary"
                                    fullWidth
                                    disabled={confirmParticipation.isPending || !privacyConsent}
                                    endIcon={
                                        confirmParticipation.isPending ? (
                                            <CircularProgress size={18} color="inherit" />
                                        ) : (
                                            <ArrowRight size={18} />
                                        )
                                    }
                                    sx={{ py: 1.5 }}
                                >
                                    {confirmParticipation.isPending ? 'Traitement…' : 'Je confirme ma participation'}
                                </Button>
                            </Box>
                        </InviteStepCard>
                    </Stack>
                </Container>
            </PublicRevelaPageShell>
        );
    }

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
                navigate({ to: '/', replace: true });
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
            <PublicRevelaPageShell>
                <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Sécuriser votre compte"
                            subtitle="Choisissez un mot de passe pour vos prochaines connexions à Révéla."
                        />

                        <InviteStepCard>
                            <InviteParticipantSummary
                                name={activationInvite.participant.name}
                                email={activationInvite.participant.email}
                            />

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                Ce lien d'invitation ne sera plus valide après cette étape.
                            </Typography>

                            {activationError ? (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {activationError}
                                </Alert>
                            ) : null}

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
                                />
                                <TextField
                                    label="Confirmer le mot de passe"
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={e => setPasswordConfirm(e.target.value)}
                                    fullWidth
                                    autoComplete="new-password"
                                />
                                <Button
                                    type="submit"
                                    appearance="primary"
                                    fullWidth
                                    disabled={activateInvite.isPending}
                                    endIcon={
                                        activateInvite.isPending ? (
                                            <CircularProgress size={18} color="inherit" />
                                        ) : (
                                            <ArrowRight size={18} />
                                        )
                                    }
                                    sx={{ py: 1.5, mt: 0.5 }}
                                >
                                    {activateInvite.isPending ? 'Activation en cours…' : 'Activer et accéder à mon espace'}
                                </Button>
                            </Box>
                        </InviteStepCard>
                    </Stack>
                </Container>
            </PublicRevelaPageShell>
        );
    }

    if (campaignBlocksFilling) {
        const waitInvite = invite;
        return (
            <PublicRevelaPageShell>
                <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Campagne en préparation"
                            subtitle={`Bonjour ${waitInvite.participant.name}, votre participation est validée.`}
                        />

                        <InviteStepCard>
                            <Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', py: 1 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        bgcolor: 'surface.lavenderGrey',
                                        color: 'text.disabled',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Lock size={28} aria-hidden />
                                </Box>
                                <Alert
                                    severity="info"
                                    sx={{
                                        borderRadius: 2,
                                        textAlign: 'left',
                                        width: '100%',
                                        '& .MuiAlert-message': { fontWeight: 500, lineHeight: 1.7 },
                                    }}
                                >
                                    Cette campagne n'est pas encore ouverte aux réponses. Vous recevrez une notification
                                    ou pourrez vous connecter lorsque votre coach l'aura activée.
                                </Alert>
                            </Stack>
                        </InviteStepCard>
                    </Stack>
                </Container>
            </PublicRevelaPageShell>
        );
    }

    if (isLoading) {
        return (
            <PublicRevelaPageShell>
                <InviteCenteredState>
                    <CircularProgress size={48} thickness={4} />
                </InviteCenteredState>
            </PublicRevelaPageShell>
        );
    }

    if (!q) return null;

    const totalQuestions = q.questions.series[0].length;
    const activeSeries = step === 'series0' ? series0 : series1;
    const setActiveSeries = step === 'series0' ? setSeries0 : setSeries1;
    const currentAnswer = step === 'series0' ? series0[currentQ] : series1[currentQ];
    const currentQuestion =
        step === 'series0' || step === 'series1' ? q.questions.series[step === 'series0' ? 0 : 1][currentQ] : null;

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
            navigate({ to: '/campaigns' });
        } catch {
            setStep('series1');
        }
    }

    const firstName = invite.participant.name.split(' ')[0];

    return (
        <PublicRevelaPageShell>
            <Container maxWidth="sm" sx={{ py: { xs: 3, md: 5 } }}>
                <Stack spacing={3}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Chip
                            label={`Type : ${q.id}`}
                            size="small"
                            sx={{ bgcolor: 'tint.primaryBg', color: 'primary.main', fontWeight: 700, mb: 1.5 }}
                        />
                        <Typography
                            variant="h3"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 900,
                                letterSpacing: -0.03,
                                lineHeight: 1.1,
                            }}
                        >
                            {q.title}
                        </Typography>
                        <Box
                            sx={{
                                width: '100%',
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'surface.lavenderGrey',
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
                                    background: theme => theme.palette.surface.progressGradient,
                                }}
                            />
                        </Box>
                    </Box>

                    {step === 'welcome' && (
                        <InviteStepCard>
                            <PageHeader
                                title={`Bonjour, ${firstName}`}
                                subtitle="Bienvenue dans votre Parcours Élément Humain."
                            />
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{
                                    p: 2.5,
                                    mb: 3,
                                    bgcolor: 'surface.lavenderGrey',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'surface.outlineVariantFaint',
                                    lineHeight: 1.7,
                                }}
                            >
                                {q.description}
                            </Typography>
                            <Button
                                appearance="primary"
                                fullWidth
                                endIcon={<ArrowRight size={18} />}
                                onClick={() => {
                                    setSeries0(Array(totalQuestions).fill(null));
                                    setSeries1(Array(totalQuestions).fill(null));
                                    setCurrentQ(0);
                                    setStep('series0');
                                }}
                                sx={{ py: 1.5 }}
                            >
                                Commencer le parcours
                            </Button>
                        </InviteStepCard>
                    )}

                    {(step === 'series0' || step === 'series1') && currentQuestion && (
                        <InviteStepCard>
                            <Box sx={{ mb: 4, textAlign: 'center' }}>
                                <Typography
                                    variant="overline"
                                    color="secondary.main"
                                    sx={{ fontWeight: 800, letterSpacing: '0.1em' }}
                                >
                                    {q.questions.series_labels[step === 'series0' ? 0 : 1]}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={700}
                                    display="block"
                                    sx={{ mt: -0.5 }}
                                >
                                    Question {currentQ + 1} sur {totalQuestions}
                                </Typography>
                            </Box>

                            <Typography
                                variant="h5"
                                fontWeight={700}
                                color="text.primary"
                                textAlign="center"
                                sx={{ mb: 5, lineHeight: 1.4 }}
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

                            <Box
                                sx={{
                                    mt: 5,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Button
                                    appearance="secondary"
                                    startIcon={<ArrowLeft size={16} />}
                                    onClick={handlePrev}
                                    disabled={step === 'series0' && currentQ === 0}
                                >
                                    Précédent
                                </Button>
                                <Button
                                    appearance="primary"
                                    endIcon={
                                        currentQ === totalQuestions - 1 && step === 'series1' ? (
                                            <Sparkles size={16} />
                                        ) : (
                                            <ArrowRight size={16} />
                                        )
                                    }
                                    onClick={handleNext}
                                    disabled={currentAnswer === null || currentAnswer === undefined}
                                >
                                    {currentQ === totalQuestions - 1 && step === 'series1' ? 'Terminer' : 'Suivant'}
                                </Button>
                            </Box>
                        </InviteStepCard>
                    )}

                    {step === 'transition' && (
                        <InviteStepCard sx={{ textAlign: 'center' }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    p: 2,
                                    bgcolor: 'tint.successBg',
                                    borderRadius: '50%',
                                    color: 'success.main',
                                    mb: 2,
                                }}
                            >
                                <CheckCircle size={40} aria-hidden />
                            </Box>
                            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                                Première série terminée
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                                Passons à la deuxième partie : <strong>{q.questions.series_labels[1]}</strong>
                            </Typography>
                            <Button
                                appearance="primary"
                                endIcon={<ArrowRight size={18} />}
                                onClick={() => {
                                    setCurrentQ(0);
                                    setStep('series1');
                                }}
                                sx={{ py: 1.5, px: 4 }}
                            >
                                Continuer
                            </Button>
                        </InviteStepCard>
                    )}

                    {step === 'submitting' && (
                        <InviteStepCard sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress size={48} thickness={4} sx={{ mb: 3 }} />
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                                Analyse de vos réponses…
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                                Génération de votre profil en cours.
                            </Typography>
                        </InviteStepCard>
                    )}
                </Stack>
            </Container>
        </PublicRevelaPageShell>
    );
}

function InviteCenteredState({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'grid',
                placeItems: 'center',
                py: { xs: 8, md: 12 },
            }}
        >
            {children}
        </Box>
    );
}

function InviteStepCard({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) {
    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, ...sx }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>{children}</CardContent>
        </Card>
    );
}

function InviteParticipantSummary({
    name,
    email,
    organisation,
}: {
    name: string;
    email: string;
    organisation?: string | null;
}) {
    return (
        <Box
            sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: 'surface.lavenderGrey',
                border: '1px solid',
                borderColor: 'surface.outlineVariantFaint',
            }}
        >
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {email}
            </Typography>
            {organisation ? (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    textTransform="uppercase"
                    sx={{ display: 'block', mt: 0.5, letterSpacing: '0.06em' }}
                >
                    {organisation}
                </Typography>
            ) : null}
        </Box>
    );
}
