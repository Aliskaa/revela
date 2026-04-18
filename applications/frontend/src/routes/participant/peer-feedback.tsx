import * as React from "react";
import { useParticipantSession } from "@/hooks/participantSession";
import { useParticipantSessionMatrix, useParticipantCampaignPeers } from "@/hooks/participantSession";
import type { ParticipantQuestionnaireMatrix } from "@aor/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  CircleUserRound,
  ClipboardList,
  Hash,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
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

type RatingItem = { label: string; value: number | null };
type DimensionBlock = { dimension: string; items: RatingItem[] };

const buildPeerDimensions = (matrix: ParticipantQuestionnaireMatrix, peerIndex: number): DimensionBlock[] => {
  const dims: DimensionBlock[] = [];
  for (const rd of matrix.result_dims) {
    const items: RatingItem[] = [];
    for (const scoreKey of rd.scores) {
      const row = matrix.rows.find(r => r.score_key === scoreKey);
      if (row) {
        const peerValue = row.peers[peerIndex] ?? null;
        items.push({ label: row.label, value: peerValue });
      }
    }
    dims.push({ dimension: rd.name, items });
  }
  return dims;
};

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
      <Stack direction="row" spacing={1.2} alignItems="start">
        <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
          <Icon size={16} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>{value}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function RatingScale({ value }: { value: number | null }) {
  return (
    <ToggleButtonGroup value={value} exclusive size="small" sx={{ flexWrap: "wrap", gap: 0.75 }}>
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

function DimensionCard({ block }: { block: DimensionBlock }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={800} color="text.primary">{block.dimension}</Typography>
            <Chip label="Pairs" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
          </Stack>
          <Stack spacing={1.5}>
            {block.items.map((item) => (
              <Box key={item.label} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
                <Stack spacing={1.4}>
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="start">
                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.6 }}>{item.label}</Typography>
                    <Chip label={item.value ?? "—"} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
                  </Stack>
                  <RatingScale value={item.value} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantPeerFeedbackRoute() {
  const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();

  const activeAssignment = React.useMemo(
    () => session?.assignments.find(a => a.campaign_status === "active") ?? session?.assignments[0],
    [session]
  );
  const qid = activeAssignment?.questionnaire_id ?? "";
  const campaignId = activeAssignment?.campaign_id ?? undefined;

  const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);
  const { data: peers = [] } = useParticipantCampaignPeers(campaignId ?? 0);

  const isLoading = sessionLoading || matrixLoading;
  const campaignActive = activeAssignment?.campaign_status === "active";
  const stepAvailable = activeAssignment?.progression?.peer_feedback_status === "pending"
    || activeAssignment?.progression?.peer_feedback_status === "completed"
    || !activeAssignment?.progression;
  const canInteract = campaignActive && stepAvailable;
  const questionnaireTitle = matrix?.questionnaire_title ?? activeAssignment?.questionnaire_title ?? "Feedback des pairs";
  const questionnaireCode = matrix?.questionnaire_id ?? qid;
  const peerColumns = matrix?.peer_columns ?? [];

  // Show the first peer's data by default
  const dimensions = React.useMemo(
    () => matrix && peerColumns.length > 0 ? buildPeerDimensions(matrix, 0) : [],
    [matrix, peerColumns.length]
  );

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
                Les pairs utilisent la même logique de saisie que l'auto-évaluation : une note de 1 à 9 sur les short labels.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">Saisie pairs</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {peerColumns.length} réponse{peerColumns.length !== 1 ? "s" : ""} reçue{peerColumns.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <InfoPill icon={ClipboardList} label="Questionnaire" value={questionnaireCode || "–"} />
        <InfoPill icon={BadgeCheck} label="Type" value="Feedback pairs" />
        <InfoPill icon={Hash} label="Échelle" value="1 à 9" />
        <InfoPill icon={Users} label="Pairs" value={`${peerColumns.length} répondant${peerColumns.length !== 1 ? "s" : ""}`} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        {dimensions.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Aucune réponse de pair reçue pour le moment. Les feedbacks apparaîtront ici dès qu'un pair aura répondu.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>Feedbacks reçus</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                Les réponses se structurent par dimension.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {dimensions.map((block) => (
                  <DimensionCard key={block.dimension} block={block} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Stack spacing={2.5}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>Pairs</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                Les pairs ayant répondu au questionnaire.
              </Typography>
              <Stack spacing={1.3} sx={{ mt: 2 }}>
                {peerColumns.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Aucun pair n'a encore répondu.</Typography>
                ) : peerColumns.map((pc) => (
                  <Stack key={pc.response_id} direction="row" spacing={1.3} alignItems="center" sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
                      <CircleUserRound size={16} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">{pc.label}</Typography>
                    </Box>
                    <Chip label="Répondu" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
