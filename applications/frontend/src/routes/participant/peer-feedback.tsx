import * as React from "react";
import { useParticipantSession, useParticipantSessionMatrix, useParticipantCampaignPeers } from "@/hooks/participantSession";
import { useSelectedAssignment } from "@/hooks/useSelectedAssignment";
import { useSubmitParticipantQuestionnaire } from "@/hooks/questionnaires";
import type { ParticipantQuestionnaireMatrix, CampaignPeerChoice } from "@aor/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CheckCircle2,
  CircleUserRound,
  ClipboardList,
  Hash,
  Save,
  Sparkles,
  Users,
} from "lucide-react";
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/peer-feedback")({
  component: ParticipantPeerFeedbackRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  border: "rgba(15,23,42,0.10)",
};

const MAX_PEERS = 5;

type ScoreItem = { scoreKey: number; label: string };
type DimensionBlock = { dimension: string; items: ScoreItem[] };

const buildDimensions = (matrix: ParticipantQuestionnaireMatrix): DimensionBlock[] => {
  const dims: DimensionBlock[] = [];
  for (const rd of matrix.result_dims) {
    const items: ScoreItem[] = [];
    for (const scoreKey of rd.scores) {
      const row = matrix.rows.find(r => r.score_key === scoreKey);
      if (row) items.push({ scoreKey, label: row.label });
    }
    dims.push({ dimension: rd.name, items });
  }
  return dims;
};

function RatingScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_e, v) => { if (v !== null) onChange(v); }}
      sx={{ flexWrap: "wrap", gap: 0.75 }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <ToggleButton
          key={i + 1}
          value={i + 1}
          sx={{
            minWidth: 38, height: 38, borderRadius: 2, borderColor: "rgba(15,23,42,0.12)", color: "text.primary",
            "&.Mui-selected": { bgcolor: COLORS.blue, color: "#fff" },
            "&.Mui-selected:hover": { bgcolor: "rgb(10,18,130)" },
          }}
        >
          {i + 1}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function DimensionCard({
  block,
  scores,
  onScoreChange,
}: {
  block: DimensionBlock;
  scores: Record<string, number | null>;
  onScoreChange: (key: string, value: number) => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={800} color="text.primary">{block.dimension}</Typography>
            <Chip label="Pair" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
          </Stack>
          <Stack spacing={1.5}>
            {block.items.map((item) => {
              const key = String(item.scoreKey);
              return (
                <Box key={key} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
                  <Stack spacing={1.4}>
                    <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="start">
                      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.6 }}>{item.label}</Typography>
                      <Chip label={scores[key] ?? "—"} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
                    </Stack>
                    <RatingScale value={scores[key] ?? null} onChange={(v) => onScoreChange(key, v)} />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PeerCard({
  peer,
  alreadyRated,
  selected,
  onClick,
}: {
  peer: CampaignPeerChoice;
  alreadyRated: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.3}
      alignItems="center"
      onClick={alreadyRated ? undefined : onClick}
      sx={{
        border: `1px solid ${selected ? COLORS.blue : COLORS.border}`,
        borderRadius: 4,
        p: 1.8,
        cursor: alreadyRated ? "default" : "pointer",
        bgcolor: selected ? "rgba(15,24,152,0.04)" : "#fff",
        opacity: alreadyRated ? 0.7 : 1,
        transition: "all 0.15s ease",
        ...(!alreadyRated ? { "&:hover": { borderColor: COLORS.blue, bgcolor: "rgba(15,24,152,0.02)" } } : {}),
      }}
    >
      <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: selected ? "rgba(15,24,152,0.12)" : "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <CircleUserRound size={16} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary">{peer.full_name}</Typography>
      </Box>
      {alreadyRated ? (
        <Chip label="Noté" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />
      ) : selected ? (
        <Chip label="Sélectionné" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
      ) : (
        <Chip label="À noter" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
      )}
    </Stack>
  );
}

function ParticipantPeerFeedbackRoute() {
  const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();

  const { assignment: activeAssignment } = useSelectedAssignment(session);
  const qid = activeAssignment?.questionnaire_id ?? "";
  const campaignId = activeAssignment?.campaign_id ?? undefined;

  const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);
  const { data: availablePeers = [] } = useParticipantCampaignPeers(campaignId ?? null);
  const submitMutation = useSubmitParticipantQuestionnaire(qid.toUpperCase(), campaignId);

  const [selectedPeer, setSelectedPeer] = React.useState<CampaignPeerChoice | null>(null);
  const [scores, setScores] = React.useState<Record<string, number | null>>({});
  const [successOpen, setSuccessOpen] = React.useState(false);

  const isLoading = sessionLoading || matrixLoading;
  const campaignActive = activeAssignment?.campaign_status === "active";
  const stepAvailable = activeAssignment?.progression?.peer_feedback_status === "pending"
    || activeAssignment?.progression?.peer_feedback_status === "completed"
    || !activeAssignment?.progression;
  const canInteract = campaignActive && stepAvailable;

  const questionnaireTitle = matrix?.questionnaire_title ?? activeAssignment?.questionnaire_title ?? "Feedback des pairs";
  const peerColumns = matrix?.peer_columns ?? [];

  // IDs of peers already rated
  const ratedPeerIds = React.useMemo(() => {
    const ids = new Set<number>();
    for (const pc of peerColumns) {
      if (pc.rated_participant_id != null) ids.add(pc.rated_participant_id);
    }
    return ids;
  }, [peerColumns]);

  const ratedCount = ratedPeerIds.size;
  const canRateMore = ratedCount < MAX_PEERS;

  const dimensions = React.useMemo(
    () => matrix ? buildDimensions(matrix) : [],
    [matrix]
  );

  const totalItems = matrix?.rows.length ?? 0;
  const filledCount = Object.values(scores).filter(v => v !== null).length;
  const allFilled = totalItems > 0 && filledCount === totalItems;

  const handleScoreChange = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectPeer = (peer: CampaignPeerChoice) => {
    setSelectedPeer(peer);
    setScores({});
  };

  const handleSubmit = async () => {
    if (!selectedPeer) return;
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (v !== null) payload[k] = v;
    }
    await submitMutation.mutateAsync({
      kind: "peer_rating",
      peer_label: selectedPeer.full_name,
      rated_participant_id: selectedPeer.participant_id,
      scores: payload,
    });
    setSuccessOpen(true);
    setSelectedPeer(null);
    setScores({});
  };

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary">Chargement du feedback des pairs</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (isError || !session) {
    return <Alert severity="error">Impossible de charger le feedback des pairs pour le moment.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        message="Feedback enregistré"
      />

      {!canInteract && (
        <Alert severity="warning">
          {!campaignActive
            ? "La campagne n'est pas active. Le feedback des pairs sera disponible une fois la campagne lancée."
            : "Cette étape n'est pas encore accessible. Vérifiez l'état de votre parcours."}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Feedback des pairs" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {questionnaireTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Sélectionnez un pair puis notez chaque item de 1 à 9. Vous pouvez évaluer jusqu'à {MAX_PEERS} pairs.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Users size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">{ratedCount} / {MAX_PEERS}</Typography>
                    <Typography variant="body2" color="text.secondary">pairs évalués</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.35fr 0.65fr" }, gap: 3, alignItems: "start" }}>
        {/* Peer list sidebar */}
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={800} color="text.primary">Pairs de la campagne</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, lineHeight: 1.7 }}>
              Sélectionnez un pair à évaluer.
            </Typography>

            {availablePeers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Aucun pair disponible dans cette campagne.</Typography>
            ) : (
              <Stack spacing={1}>
                {availablePeers.map((peer) => {
                  const alreadyRated = ratedPeerIds.has(peer.participant_id);
                  const isSelected = selectedPeer?.participant_id === peer.participant_id;
                  return (
                    <PeerCard
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
              <Alert severity="info" sx={{ mt: 2 }}>
                Vous avez atteint le maximum de {MAX_PEERS} pairs évalués.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Rating form */}
        {selectedPeer ? (
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                  <CircleUserRound size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="text.primary">
                    {selectedPeer.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filledCount} / {totalItems} items complétés
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {dimensions.map((block) => (
                  <DimensionCard key={block.dimension} block={block} scores={scores} onScoreChange={handleScoreChange} />
                ))}
              </Stack>

              {submitMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Erreur lors de l'enregistrement. Réessayez.
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={allFilled ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  onClick={handleSubmit}
                  disabled={!canInteract || filledCount === 0 || submitMutation.isPending}
                  sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
                >
                  {submitMutation.isPending
                    ? "Enregistrement…"
                    : allFilled
                      ? `Valider le feedback pour ${selectedPeer.first_name}`
                      : `Enregistrer (${filledCount}/${totalItems})`}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => { setSelectedPeer(null); setScores({}); }}
                  sx={{ borderRadius: 3, textTransform: "none" }}
                >
                  Annuler
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 4, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", mx: "auto", mb: 2 }}>
                <Sparkles size={24} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Sélectionnez un pair
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                Cliquez sur un pair dans la liste à gauche pour commencer à remplir le feedback.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Stack>
  );
}
