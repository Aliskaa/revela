import type { CampaignStatus } from '@aor/types';
import { useParticipantSessionMatrix } from '@/hooks/participantSession';
import { useQuestionnaire } from '@/hooks/questionnaires';
import { Alert, Box, Button, Card, CardContent, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { CheckCircle, ChevronRight, Lock, Unlock, Users } from 'lucide-react';
import type { ReactNode } from 'react';

type JourneyStepCardProps = {
    step: number;
    title: string;
    subtitle: string;
    done: boolean;
    muted: boolean;
    children?: ReactNode;
    footer: ReactNode;
};

export type AssignmentProgression = {
    self_rating_status: 'locked' | 'pending' | 'completed';
    peer_feedback_status: 'locked' | 'pending' | 'completed';
    element_humain_status: 'locked' | 'pending' | 'completed';
    results_status: 'locked' | 'pending' | 'completed';
} | null;

type AssignedQuestionnaireCardProps = {
    qid: string;
    campaignId: number | null;
    campaignStatus: CampaignStatus | null;
    invitationConfirmed: boolean;
    progression: AssignmentProgression;
};

const JourneyStepCard = ({ step, title, subtitle, done, muted, children, footer }: JourneyStepCardProps) => {
    return (
        <Card
            variant="outlined"
            sx={{
                flex: 1,
                borderRadius: 3,
                overflow: 'hidden',
                borderColor: done ? 'success.light' : 'divider',
                opacity: muted ? 0.7 : 1,
                boxShadow: muted ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2.5,
                    py: 2,
                    bgcolor: done
                        ? 'rgba(34, 197, 94, 0.05)'
                        : muted
                          ? 'background.default'
                          : 'rgba(21, 21, 176, 0.03)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: done ? 'success.main' : muted ? 'text.disabled' : 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                    }}
                >
                    {done ? <CheckCircle size={18} /> : step}
                </Box>
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 800, color: done ? 'success.dark' : 'text.primary', lineHeight: 1.2 }}
                    >
                        {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {subtitle}
                    </Typography>
                </Box>
            </Box>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>{children}</CardContent>
            <Box sx={{ p: 2.5, pt: 0 }}>{footer}</Box>
        </Card>
    );
};

export const AssignedQuestionnaireCard = ({
    qid,
    campaignId,
    campaignStatus,
    invitationConfirmed,
    progression,
}: AssignedQuestionnaireCardProps) => {
    const { data: questionnaire, isLoading: qLoading, error: qError } = useQuestionnaire(qid);
    const { data: matrix, isLoading: mLoading } = useParticipantSessionMatrix(true, qid, campaignId);

    if (qLoading || mLoading) {
        return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 4 }} />;
    }

    if (qError || !questionnaire) {
        return (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                Impossible de charger le questionnaire {qid}.
            </Alert>
        );
    }

    const selfStatus = progression?.self_rating_status ?? 'pending';
    const peerStatus = progression?.peer_feedback_status ?? 'pending';
    const scientificStatus = progression?.element_humain_status ?? 'locked';
    const hasSelfRating = selfStatus === 'completed';
    const hasEnoughPeers = peerStatus === 'completed';
    const hasScientific = scientificStatus === 'completed';
    const isScientificUnlocked = scientificStatus !== 'locked';
    const hasCampaign = typeof campaignId === 'number' && Number.isFinite(campaignId);
    const canFillQuestionnaires = hasCampaign && campaignStatus === 'active' && invitationConfirmed === true;
    const peerCount = matrix?.peer_columns?.length || 0;

    return (
        <Card
            sx={{
                mb: 6,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}
        >
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                        <Chip
                            label={campaignId ? `Campagne #${campaignId}` : 'Campagne non définie'}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: 'background.default', color: 'text.secondary' }}
                        />
                        <Chip
                            label={`Type : ${questionnaire.id}`}
                            size="small"
                            sx={{ bgcolor: 'rgba(21, 21, 176, 0.08)', color: 'primary.main', fontWeight: 800 }}
                        />
                    </Stack>
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 1 }}>
                        {questionnaire.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 800 }}>
                        {questionnaire.description}
                    </Typography>
                    {!hasCampaign && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            Cette assignation n'est pas rattachée à une campagne active. Le parcours est verrouillé.
                        </Alert>
                    )}
                    {hasCampaign && !invitationConfirmed && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                            Confirmez votre participation via le lien d&apos;invitation reçu par e-mail avant de
                            commencer les questionnaires.
                        </Alert>
                    )}
                    {hasCampaign && invitationConfirmed && campaignStatus !== 'active' && (
                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                            La campagne n&apos;est pas encore active : les questionnaires seront disponibles lorsque votre
                            coach l&apos;aura ouverte.
                        </Alert>
                    )}
                </Box>

                <Alert
                    severity="info"
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'info.light',
                        '& .MuiAlert-message': { fontWeight: 500 },
                    }}
                >
                    <strong>Rappel :</strong> Il n'y a pas de bonnes ou de mauvaises réponses. Vos scores reflètent
                    simplement vos fonctionnements et besoins actuels.
                </Alert>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    <JourneyStepCard
                        step={1}
                        title="Auto-évaluation"
                        subtitle="Votre propre perception"
                        done={hasSelfRating}
                        muted={false}
                        footer={
                            hasSelfRating ? (
                                <Link to="/participant/results" style={{ textDecoration: 'none' }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="primary"
                                        endIcon={<ChevronRight size={16} />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Voir les résultats
                                    </Button>
                                </Link>
                            ) : canFillQuestionnaires ? (
                                <Link to="/participant/self-rating" style={{ textDecoration: 'none' }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        disableElevation
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Commencer
                                    </Button>
                                </Link>
                            ) : (
                                <Button fullWidth disabled variant="outlined" sx={{ borderRadius: 2 }}>
                                    En attente
                                </Button>
                            )
                        }
                    >
                        <Box
                            sx={{
                                py: 1,
                                display: 'flex',
                                justifyContent: 'space-around',
                                alignItems: 'flex-end',
                                height: 120,
                            }}
                        >
                            {questionnaire.result_dims?.slice(0, 3).map((dim: any, i: number) => (
                                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                        variant="caption"
                                        fontWeight="bold"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}
                                    >
                                        {dim.title?.slice(0, 3)}...
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, height: 60, alignItems: 'flex-end' }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: hasSelfRating ? '80%' : '20%',
                                                bgcolor: 'primary.main',
                                                borderRadius: 1,
                                                opacity: hasSelfRating ? 1 : 0.2,
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: hasSelfRating ? '60%' : '20%',
                                                bgcolor: 'secondary.main',
                                                borderRadius: 1,
                                                opacity: hasSelfRating ? 1 : 0.2,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </JourneyStepCard>

                    <JourneyStepCard
                        step={2}
                        title="Mes feedbacks"
                        subtitle={hasEnoughPeers ? 'Retours pairs complétés' : 'Retours pairs à compléter'}
                        done={hasEnoughPeers}
                        muted={false}
                        footer={
                            hasEnoughPeers ? (
                                <Typography
                                    variant="caption"
                                    color="success.main"
                                    fontWeight={700}
                                    sx={{ display: 'block', textAlign: 'center', py: 1 }}
                                >
                                    ✓ {peerCount} retours validés
                                </Typography>
                            ) : canFillQuestionnaires ? (
                                <Link to="/participant/peer-feedback" style={{ textDecoration: 'none' }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        disableElevation
                                        startIcon={<Users size={16} />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Saisir
                                    </Button>
                                </Link>
                            ) : (
                                <Button fullWidth disabled variant="outlined" sx={{ borderRadius: 2 }}>
                                    En attente
                                </Button>
                            )
                        }
                    >
                        <Box sx={{ py: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    pb: 1,
                                    mb: 1,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: '40%' }}>
                                    Dim.
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    sx={{ width: '30%', textAlign: 'center' }}
                                >
                                    Pair 1
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    sx={{ width: '30%', textAlign: 'center' }}
                                >
                                    Pair 2
                                </Typography>
                            </Box>
                            {questionnaire.result_dims?.slice(0, 3).map((dim: any, i: number) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ width: '40%' }} noWrap>
                                        {dim.title}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            width: '30%',
                                            textAlign: 'center',
                                            color: peerCount >= 1 ? 'success.main' : 'text.disabled',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {peerCount >= 1 ? '✓' : '-'}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            width: '30%',
                                            textAlign: 'center',
                                            color: peerCount >= 2 ? 'success.main' : 'text.disabled',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {peerCount >= 2 ? '✓' : '-'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </JourneyStepCard>

                    <JourneyStepCard
                        step={3}
                        title="Test Élément Humain"
                        subtitle="Questionnaire approfondi"
                        done={hasScientific}
                        muted={!isScientificUnlocked && !hasScientific}
                        footer={
                            hasScientific ? (
                                <Link to="/participant/results" style={{ textDecoration: 'none' }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        color="primary"
                                        endIcon={<ChevronRight size={16} />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Voir les résultats
                                    </Button>
                                </Link>
                            ) : isScientificUnlocked && canFillQuestionnaires ? (
                                <Link
                                    to="/participant/test/$questionnaireCode"
                                    params={{ questionnaireCode: qid }}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="secondary"
                                        disableElevation
                                        startIcon={<Unlock size={16} />}
                                        sx={{ borderRadius: 2, color: 'secondary.contrastText' }}
                                    >
                                        Passer le test
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    fullWidth
                                    disabled
                                    variant="outlined"
                                    startIcon={<Lock size={16} />}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Verrouillé
                                </Button>
                            )
                        }
                    >
                        <Box
                            sx={{
                                py: 3,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            {!isScientificUnlocked && !hasScientific ? (
                                <>
                                    <Lock size={32} style={{ color: '#9ca3af', marginBottom: 8 }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                        Remplissez les étapes 1 et 2 pour débloquer le test.
                                    </Typography>
                                </>
                            ) : hasScientific ? (
                                <Typography variant="body2" fontWeight={700} color="success.main">
                                    Parcours scientifique complété avec succès.
                                </Typography>
                            ) : (
                                <Typography variant="body2" fontWeight={600} color="primary.main">
                                    Le test est prêt. Lancez-le dès que vous avez 15 minutes devant vous.
                                </Typography>
                            )}
                        </Box>
                    </JourneyStepCard>
                </Box>
            </CardContent>
        </Card>
    );
};
