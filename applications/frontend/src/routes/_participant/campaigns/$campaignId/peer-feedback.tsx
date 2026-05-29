// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingCard } from '@/components/common/LoadingCard';
import { ListPanel, PageHeader } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CampaignNotActiveBlock } from '@/components/participant-dashboard/CampaignNotActiveBlock';
import { PeerSelectCard } from '@/components/participant-dashboard/PeerSelectCard';
import { StepCompletedBanner } from '@/components/participant-dashboard/StepCompletedBanner';
import { QuestionnaireProgress } from '@/components/questionnaire/QuestionnaireProgress';
import { RatingDimensionAccordion } from '@/components/questionnaire/RatingDimensionAccordion';
import { LIKERT_SHORT_LABEL } from '@/components/questionnaire/questionnaireScales';
import {
    useConfirmPeerFeedback,
    useParticipantCampaignPeers,
    useParticipantSession,
    useParticipantSessionMatrix,
} from '@/hooks/participantSession';
import { useSubmitParticipantQuestionnaire } from '@/hooks/questionnaires';
import { useBuildDimensions } from '@/hooks/useBuildDimensions';
import { useToast } from '@/lib/toast';
import type { CampaignPeerChoice } from '@aor/types';
import { Alert, Box, Chip, LinearProgress, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { BadgeCheck, CheckCircle2, Sparkles, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/peer-feedback')({
    component: ParticipantPeerFeedbackRoute,
});

const MAX_PEERS = 5;

const PAGE_SUBTITLE = `Sélectionnez un pair puis notez chaque item de ${LIKERT_SHORT_LABEL.rangeLabel}. Vous pouvez évaluer jusqu'à ${MAX_PEERS} pairs.`;

function ParticipantPeerFeedbackRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);
    const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();
    const navigate = useNavigate();
    const toast = useToast();

    const assignment = React.useMemo(() => {
        if (!session || !Number.isFinite(campaignId)) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const qid = assignment?.questionnaire_id ?? '';
    const safeCampaignId = Number.isFinite(campaignId) ? campaignId : undefined;

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        safeCampaignId
    );
    const { data: availablePeers = [] } = useParticipantCampaignPeers(safeCampaignId ?? null);
    const submitMutation = useSubmitParticipantQuestionnaire(qid.toUpperCase(), safeCampaignId);
    const confirmMutation = useConfirmPeerFeedback();

    const [selectedPeer, setSelectedPeer] = React.useState<CampaignPeerChoice | null>(null);
    const [scores, setScores] = React.useState<Record<string, number | null>>({});
    const [comments, setComments] = React.useState<Record<string, string>>({});

    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Feedback des pairs' },
    ]);

    const isLoading = sessionLoading || matrixLoading;
    const campaignActive = assignment?.campaign_status === 'active';
    const stepAvailable =
        assignment?.progression?.peer_feedback_status === 'pending' ||
        assignment?.progression?.peer_feedback_status === 'completed' ||
        !assignment?.progression;
    const canInteract = campaignActive && stepAvailable;

    const questionnaireTitle = matrix?.questionnaire_title ?? assignment?.questionnaire_title ?? 'Feedback des pairs';
    const questionnaireCode = matrix?.questionnaire_id ?? qid;
    const peerColumns = matrix?.peer_columns ?? [];

    const ratedPeerIds = React.useMemo(() => {
        const ids = new Set<number>();
        for (const pc of peerColumns) {
            if (pc.rated_participant_id != null) ids.add(pc.rated_participant_id);
        }
        return ids;
    }, [peerColumns]);

    const ratedCount = ratedPeerIds.size;
    const canRateMore = ratedCount < MAX_PEERS;

    const dimensions = useBuildDimensions(matrix);

    const totalItems = matrix?.rows.length ?? 0;
    const filledCount = Object.values(scores).filter(v => v !== null).length;
    const allFilled = totalItems > 0 && filledCount === totalItems;
    const progressPct = totalItems > 0 ? Math.round((filledCount / totalItems) * 100) : 0;

    const handleScoreChange = (key: string, value: number) => {
        setScores(prev => ({ ...prev, [key]: value }));
    };

    const handleCommentChange = (key: string, value: string) => {
        setComments(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectPeer = (peer: CampaignPeerChoice) => {
        setSelectedPeer(peer);
        setScores({});
        setComments({});
    };

    const handleSubmit = async () => {
        if (!selectedPeer) return;
        const payload: Record<string, number> = {};
        for (const [k, v] of Object.entries(scores)) {
            if (v !== null) payload[k] = v;
        }
        // Ne joindre que les commentaires non vides ET attachés à une note saisie
        // (le backend rejette tout commentaire orphelin avec une 400).
        const commentsPayload: Record<string, string> = {};
        for (const [k, v] of Object.entries(comments)) {
            const trimmed = v.trim();
            if (trimmed.length > 0 && k in payload) {
                commentsPayload[k] = trimmed;
            }
        }
        try {
            await submitMutation.mutateAsync({
                kind: 'peer_rating',
                peer_label: selectedPeer.full_name,
                rated_participant_id: selectedPeer.participant_id,
                scores: payload,
                ...(Object.keys(commentsPayload).length > 0 ? { comments: commentsPayload } : {}),
            });
        } catch {
            toast.error("Erreur lors de l'enregistrement. Réessayez.");
            return;
        }
        toast.success('Feedback enregistré');
        setSelectedPeer(null);
        setScores({});
        setComments({});

        // Auto-complete au 5e feedback (cf. P12/P13) → cohérent avec P10 : on redirige
        // sur la fiche campagne pour matérialiser la fin de l'étape.
        if (safeCampaignId !== undefined && ratedCount + 1 >= MAX_PEERS) {
            setTimeout(() => {
                navigate({ to: '/campaigns/$campaignId', params: { campaignId: String(safeCampaignId) } });
            }, 1500);
        }
    };

    const handleConfirmDone = async () => {
        if (safeCampaignId === undefined) return;
        try {
            await confirmMutation.mutateAsync(safeCampaignId);
            navigate({ to: '/campaigns/$campaignId', params: { campaignId: String(safeCampaignId) } });
        } catch {
            // Toast émis par le hook ; on garde l'utilisateur sur la page.
        }
    };

    if (isLoading) {
        return <LoadingCard title="Chargement du feedback des pairs" />;
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger le feedback des pairs pour le moment.</Alert>;
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

    if (assignment.progression?.peer_feedback_status === 'completed') {
        return (
            <StepCompletedBanner
                title="Feedback des pairs déjà soumis"
                description="Vous avez validé le feedback des pairs. Pour préserver l'intégrité du parcours, il ne peut plus être modifié."
            />
        );
    }

    if (!campaignActive) {
        return <CampaignNotActiveBlock campaignId={assignment.campaign_id} />;
    }

    const submitButton = (
        <Button
            appearance="primary"
            startIcon={<CheckCircle2 size={16} />}
            onClick={handleSubmit}
            disabled={!canInteract || !allFilled || submitMutation.isPending}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
            {submitMutation.isPending
                ? 'Enregistrement…'
                : selectedPeer
                  ? `Valider le feedback pour ${selectedPeer.first_name}`
                  : 'Valider le feedback'}
        </Button>
    );

    const cancelButton = (
        <Button
            appearance="secondary"
            onClick={() => {
                setSelectedPeer(null);
                setScores({});
                setComments({});
            }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
            Annuler
        </Button>
    );

    return (
        <Stack spacing={3} sx={{ minWidth: 0, pb: { xs: selectedPeer ? 12 : 0, md: 0 } }}>
            {selectedPeer && totalItems > 0 && (
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
                            aria-label={`Progression du feedback pour ${selectedPeer.first_name}`}
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
                <PageHeader title="Feedback des pairs" subtitle={PAGE_SUBTITLE} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {campaignName} · {questionnaireTitle}
                    {questionnaireCode ? ` (${questionnaireCode})` : ''}
                </Typography>
            </Box>

            {!canInteract && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    {!campaignActive
                        ? "La campagne n'est pas active. Le feedback des pairs sera disponible une fois la campagne lancée."
                        : "Cette étape n'est pas encore accessible. Vérifiez l'état de votre parcours."}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '0.35fr 0.65fr' },
                    gap: 3,
                    alignItems: 'start',
                    minWidth: 0,
                }}
            >
                <ListPanel
                    title="Pairs de la campagne"
                    subtitle="Sélectionnez un pair à évaluer."
                    headerBorder
                    headerActions={
                        <Chip
                            icon={<Users size={14} />}
                            label={`${ratedCount} / ${MAX_PEERS} évalués`}
                            sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', fontWeight: 700 }}
                        />
                    }
                >
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
                        {availablePeers.length === 0 ? (
                            <EmptyState
                                icon={Users}
                                variant="muted"
                                title="Aucun pair disponible"
                                description="Aucun pair n'est rattaché à cette campagne pour le moment."
                                boxed={false}
                            />
                        ) : (
                            <Stack spacing={1}>
                                {availablePeers.map(peer => {
                                    const alreadyRated = ratedPeerIds.has(peer.participant_id);
                                    const isSelected = selectedPeer?.participant_id === peer.participant_id;
                                    return (
                                        <PeerSelectCard
                                            key={peer.participant_id}
                                            peer={peer}
                                            alreadyRated={alreadyRated}
                                            selected={isSelected}
                                            onClick={() => {
                                                if (canInteract && canRateMore) handleSelectPeer(peer);
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        )}

                        {!canRateMore && (
                            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                                Vous avez atteint le maximum de {MAX_PEERS} pairs évalués. L'étape se termine
                                automatiquement.
                            </Alert>
                        )}

                        {ratedCount >= 1 && canRateMore && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    appearance="primary"
                                    fullWidth
                                    startIcon={<BadgeCheck size={16} />}
                                    onClick={handleConfirmDone}
                                    disabled={!canInteract || confirmMutation.isPending}
                                >
                                    {confirmMutation.isPending ? 'Confirmation…' : "J'ai terminé mes feedbacks"}
                                </Button>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.8, lineHeight: 1.5 }}
                                >
                                    Vous pouvez confirmer la fin de cette étape dès maintenant ou continuer (jusqu'à{' '}
                                    {MAX_PEERS} pairs).
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </ListPanel>

                {selectedPeer ? (
                    <ListPanel
                        title={selectedPeer.full_name}
                        subtitle={`Notez chaque item de ${LIKERT_SHORT_LABEL.rangeLabel}.`}
                        headerBorder
                    >
                        <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
                            <Box sx={{ mb: 2 }}>
                                <QuestionnaireProgress
                                    filled={filledCount}
                                    total={totalItems}
                                    ariaLabel={`Progression du feedback pour ${selectedPeer.first_name}`}
                                />
                            </Box>

                            <RatingDimensionAccordion
                                dimensions={dimensions}
                                scores={scores}
                                onScoreChange={handleScoreChange}
                                min={LIKERT_SHORT_LABEL.min}
                                max={LIKERT_SHORT_LABEL.max}
                                comments={comments}
                                onCommentChange={handleCommentChange}
                            />

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1.2}
                                sx={{ mt: 3, display: { xs: 'none', md: 'flex' } }}
                            >
                                {submitButton}
                                {cancelButton}
                            </Stack>
                        </Box>
                    </ListPanel>
                ) : (
                    <ListPanel title="Sélectionnez un pair" subtitle="Commencez par choisir un pair à évaluer." headerBorder>
                        <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                            <EmptyState
                                icon={Sparkles}
                                variant="primary"
                                title="Aucun pair sélectionné"
                                description="Cliquez sur un pair dans la liste à gauche pour commencer à remplir le feedback."
                                boxed={false}
                            />
                        </Box>
                    </ListPanel>
                )}
            </Box>

            {selectedPeer && dimensions.length > 0 && (
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
                    <Stack direction="row" spacing={1.2}>
                        {submitButton}
                        {cancelButton}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
}
