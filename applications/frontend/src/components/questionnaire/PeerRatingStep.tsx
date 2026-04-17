import { participantApiClient } from '@/api/participantClient';
import type { CampaignPeerChoice, QuestionnaireDetail, SubmitParticipantPeerRatingBody } from '@aor/types';
import { AiPlaceholder } from '@/components/common/AiPlaceholder';
import { DimensionCards } from '@/components/common/DimensionCards';
import { useParticipantCampaignPeers, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { Alert, Autocomplete, Box, Button, CircularProgress, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { aorPrimaryButtonSx, buildDimensionScoreMap, invalidateParticipantSessionQueries } from './helpers';

type PeerRatingStepProps = {
    qid: string;
    q: QuestionnaireDetail;
    campaignId: number | null;
};

const MAX_PEERS = 5;

export function PeerRatingStep({ qid, q, campaignId }: PeerRatingStepProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: matrix } = useParticipantSessionMatrix(true, qid, campaignId);
    const {
        data: peerChoices = [],
        isLoading: peersLoading,
        isError: peersError,
        error: peersQueryError,
    } = useParticipantCampaignPeers(campaignId);

    const peerById = useMemo(() => {
        const m = new Map<number, CampaignPeerChoice>();
        for (const p of peerChoices) {
            m.set(p.participant_id, p);
        }
        return m;
    }, [peerChoices]);

    const [activeTab, setActiveTab] = useState(0);
    const [selectedPeerIds, setSelectedPeerIds] = useState<number[]>([]);
    const [peerScores, setPeerScores] = useState<Record<string, number>[]>([]);
    const [didInitScoresFromMatrix, setDidInitScoresFromMatrix] = useState(false);
    const matrixSelectionSyncedRef = useRef(false);

    useEffect(() => {
        if (!matrix || matrixSelectionSyncedRef.current) {
            return;
        }
        const cols = matrix.peer_columns;
        if (cols.length === 0) {
            return;
        }
        const ids = cols.map(c => c.rated_participant_id);
        const allNumeric = ids.every((x): x is number => x !== null && x !== undefined && Number.isFinite(x));
        if (!allNumeric) {
            return;
        }
        setSelectedPeerIds(ids);
        matrixSelectionSyncedRef.current = true;
    }, [matrix]);

    useEffect(() => {
        const len = selectedPeerIds.length;
        setPeerScores(prev => {
            if (prev.length === len) {
                return prev;
            }
            return Array.from({ length: len }, (_, i) => prev[i] ?? buildDimensionScoreMap(q));
        });
    }, [selectedPeerIds.length, q]);

    useEffect(() => {
        if (selectedPeerIds.length > 0 && activeTab >= selectedPeerIds.length) {
            setActiveTab(Math.max(0, selectedPeerIds.length - 1));
        }
    }, [selectedPeerIds.length, activeTab]);

    useEffect(() => {
        if (!matrix || didInitScoresFromMatrix || matrix.peer_columns.length === 0 || selectedPeerIds.length === 0) {
            return;
        }
        const cols = matrix.peer_columns;
        if (cols.length !== selectedPeerIds.length) {
            return;
        }
        const colIds = cols.map(c => c.rated_participant_id);
        const allNumeric = colIds.every((x): x is number => x !== null && x !== undefined && Number.isFinite(x));
        if (!allNumeric) {
            return;
        }
        if (!selectedPeerIds.every((id, i) => id === colIds[i])) {
            return;
        }

        setPeerScores(prev => {
            const next = [...prev];
            for (let i = 0; i < cols.length; i++) {
                const current = { ...next[i] };
                for (const row of matrix.rows) {
                    const peerValue = row.peers[i];
                    if (peerValue !== null && peerValue !== undefined) {
                        current[String(row.score_key)] = peerValue;
                    }
                }
                next[i] = current;
            }
            return next;
        });
        setDidInitScoresFromMatrix(true);
    }, [matrix, didInitScoresFromMatrix, selectedPeerIds]);

    const submitPeers = useMutation({
        mutationFn: async () => {
            const existingRatedIds = new Set(
                (matrix?.peer_columns ?? [])
                    .map(c => c.rated_participant_id)
                    .filter((x): x is number => x !== null && x !== undefined && Number.isFinite(x))
            );
            const pendingIds = selectedPeerIds.filter(id => !existingRatedIds.has(id));
            if (pendingIds.length === 0) {
                throw new Error(
                    'Tous les pairs sélectionnés ont déjà un feedback enregistré. Retirez-les ou ajoutez un autre pair.'
                );
            }
            for (let i = 0; i < selectedPeerIds.length; i++) {
                const id = selectedPeerIds[i];
                if (existingRatedIds.has(id)) {
                    continue;
                }
                const peer = peerById.get(id);
                const body: SubmitParticipantPeerRatingBody = {
                    kind: 'peer_rating',
                    peer_label: peer?.full_name ?? `Participant #${String(id)}`,
                    rated_participant_id: id,
                    scores: peerScores[i] ?? buildDimensionScoreMap(q),
                };
                await participantApiClient.post(`/participant/questionnaires/${qid}/submit`, body, {
                    params: { campaign_id: campaignId ?? undefined },
                });
            }
        },
        onSuccess: () => {
            invalidateParticipantSessionQueries(queryClient);
            navigate({ to: '/participant' });
        },
    });

    const selectedPeersValue = useMemo(
        () => selectedPeerIds.map(id => peerById.get(id)).filter((row): row is CampaignPeerChoice => row !== undefined),
        [selectedPeerIds, peerById]
    );

    const values = peerScores[activeTab] ?? buildDimensionScoreMap(q);

    const onScoreChange = (key: string, value: number) => {
        setPeerScores(prev => {
            const next = [...prev];
            next[activeTab] = { ...next[activeTab], [key]: value };
            return next;
        });
    };

    const onPeersChange = (_: unknown, value: CampaignPeerChoice[]) => {
        if (value.length > MAX_PEERS) {
            return;
        }
        setSelectedPeerIds(value.map(p => p.participant_id));
        setDidInitScoresFromMatrix(false);
        setActiveTab(0);
    };

    if (campaignId === null) {
        return (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Une campagne est requise pour choisir des pairs.
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Choisissez jusqu’à {MAX_PEERS} collègues ayant confirmé leur participation à la campagne, puis saisissez
                les scores (0 à 9) issus de la grille papier pour chacun.
            </Typography>

            {peersError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {peersQueryError instanceof Error
                        ? peersQueryError.message
                        : 'Impossible de charger la liste des pairs.'}
                </Alert>
            )}

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                {peersLoading ? (
                    <CircularProgress size={28} sx={{ mt: 1 }} />
                ) : (
                    <Autocomplete
                        multiple
                        sx={{ flex: 1, minWidth: 280, maxWidth: 720 }}
                        options={peerChoices}
                        getOptionLabel={option => option.full_name}
                        value={selectedPeersValue}
                        onChange={onPeersChange}
                        isOptionEqualToValue={(a, b) => a.participant_id === b.participant_id}
                        filterSelectedOptions
                        renderInput={params => (
                            <TextField
                                {...params}
                                label={`Pairs à évaluer (max. ${MAX_PEERS})`}
                                placeholder="Rechercher par nom…"
                            />
                        )}
                        disabled={submitPeers.isPending}
                    />
                )}
            </Box>

            {selectedPeerIds.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                    Sélectionnez au moins un pair pour accéder à la grille de scores.
                </Alert>
            ) : (
                <>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        variant="scrollable"
                        sx={{
                            mb: 3,
                            minHeight: 48,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 2,
                                mx: 0.5,
                                minHeight: 44,
                                color: 'text.primary',
                            },
                            '& .Mui-selected': {
                                bgcolor: 'rgba(21, 21, 176, 0.08) !important',
                                color: 'primary.main !important',
                            },
                            '& .MuiTabs-indicator': { display: 'none' },
                        }}
                    >
                        {selectedPeerIds.map(id => {
                            const label = peerById.get(id)?.full_name ?? `Participant #${String(id)}`;
                            return <Tab key={id} label={label} />;
                        })}
                    </Tabs>

                    {submitPeers.isError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {submitPeers.error.message}
                        </Alert>
                    )}

                    <DimensionCards q={q} values={values} onScoreChange={onScoreChange} />
                </>
            )}

            <AiPlaceholder title="Analyse croisée (aperçu)" fullWidth>
                Lorsque plusieurs sources seront disponibles, une synthèse pourra mettre en regard votre auto-évaluation
                et les retours pairs (ex. écarts sur une dimension). Contenu indicatif - pas d&apos;appel IA branché
                pour l&apos;instant.
            </AiPlaceholder>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={submitPeers.isPending || selectedPeerIds.length === 0 || peersLoading || peersError}
                    onClick={() => submitPeers.mutate()}
                    endIcon={<Sparkles size={18} />}
                    sx={aorPrimaryButtonSx}
                >
                    {submitPeers.isPending ? 'Enregistrement...' : 'Valider les feedbacks pairs'}
                </Button>
            </Box>
        </Box>
    );
}
