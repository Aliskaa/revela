import * as React from "react";
import { useParticipantSession, useParticipantSessionMatrix } from "@/hooks/participantSession";
import { useSelectedAssignment } from "@/hooks/useSelectedAssignment";
import { useCampaignStore } from "@/stores/campaignStore";
import type { ParticipantQuestionnaireMatrix } from "@aor/types";
import { createFileRoute } from "@tanstack/react-router";
import {
  Radar,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/results")({
  component: ParticipantResultsRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  green: "rgb(4,120,87)",
  border: "rgba(15,23,42,0.10)",
};

type ScoreRow = {
  label: string;
  self: number | null;
  peersAvg: number | null;
  scientific: number | null;
};

type DimensionView = {
  name: string;
  rows: ScoreRow[];
};

const avg = (values: (number | null)[]): number | null => {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10;
};

const buildDimensions = (matrix: ParticipantQuestionnaireMatrix): DimensionView[] => {
  const dims: DimensionView[] = [];
  for (const rd of matrix.result_dims) {
    const rows: ScoreRow[] = [];
    for (const scoreKey of rd.scores) {
      const row = matrix.rows.find(r => r.score_key === scoreKey);
      if (row) {
        rows.push({
          label: row.label,
          self: row.self,
          peersAvg: avg(row.peers),
          scientific: row.scientific,
        });
      }
    }
    dims.push({ name: rd.name, rows });
  }
  return dims;
};

function ScoreBar({ value, max, color }: { value: number | null; max: number; color: string }) {
  const pct = value != null ? Math.round((value / max) * 100) : 0;
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ minWidth: 24, textAlign: "right" }}>
        {value ?? "–"}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ flex: 1, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: color } }}
      />
    </Stack>
  );
}

function DimensionCard({ dimension, likertMax }: { dimension: DimensionView; likertMax: number }) {
  const hasPeers = dimension.rows.some(r => r.peersAvg !== null);
  const hasScientific = dimension.rows.some(r => r.scientific !== null);

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>{dimension.name}</Typography>

        <Stack spacing={2}>
          {dimension.rows.map((row) => (
            <Box key={row.label} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 3, p: 2 }}>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                {row.label}
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip label="Auto" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, minWidth: 70, fontWeight: 700, fontSize: 11 }} />
                  <ScoreBar value={row.self} max={likertMax} color={COLORS.blue} />
                </Stack>
                {hasPeers && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="Pairs" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", minWidth: 70, fontWeight: 700, fontSize: 11 }} />
                    <ScoreBar value={row.peersAvg} max={likertMax} color={COLORS.yellow} />
                  </Stack>
                )}
                {hasScientific && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="Test" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: COLORS.green, minWidth: 70, fontWeight: 700, fontSize: 11 }} />
                    <ScoreBar value={row.scientific} max={likertMax} color={COLORS.green} />
                  </Stack>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantResultsRoute() {
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
  const { assignment: selectedAssignment, index: selectedIndex, assignments } = useSelectedAssignment(session);
  const selectCampaign = useCampaignStore(s => s.select);

  const qid = selectedAssignment?.questionnaire_id ?? "";
  const campaignId = selectedAssignment?.campaign_id ?? undefined;

  const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);

  const isLoading = sessionLoading || matrixLoading;
  const coachName = selectedAssignment?.coach_name ?? "–";
  const campaignName = selectedAssignment?.campaign_name ?? "Résultats";
  const peerCount = matrix?.peer_columns.length ?? 0;

  const dimensions = React.useMemo(
    () => matrix ? buildDimensions(matrix) : [],
    [matrix]
  );

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary">Chargement des résultats</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (sessionError || !session) {
    return <Alert severity="error">Impossible de charger vos résultats pour le moment.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Résultats" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {campaignName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Synthèse des scores par dimension : auto-évaluation, moyenne des pairs et test scientifique.
              </Typography>
              {assignments.length > 1 && (
                <FormControl size="small" sx={{ mt: 2, minWidth: 300 }}>
                  <InputLabel>Campagne</InputLabel>
                  <Select
                    label="Campagne"
                    value={selectedIndex}
                    onChange={(e) => {
                      const idx = e.target.value as number;
                      const a = assignments[idx];
                      if (a?.campaign_id != null) selectCampaign(a.campaign_id);
                    }}
                  >
                    {assignments.map((a, i) => (
                      <MenuItem key={`${a.campaign_id}-${a.questionnaire_id}`} value={i}>
                        {a.campaign_name ?? "Campagne"} — {a.questionnaire_title ?? a.questionnaire_id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Stack spacing={1.2} sx={{ width: { xs: "100%", sm: 340 } }}>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                    <Users size={16} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Coach</Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">{coachName}</Typography>
                  </Box>
                </CardContent>
              </Card>
              <Card variant="outlined">
                <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", display: "grid", placeItems: "center" }}>
                    <Radar size={16} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Sources</Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      Auto-éval · {peerCount} pair{peerCount !== 1 ? "s" : ""} · Test
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Legend */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Chip label="Auto-évaluation" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, fontWeight: 700 }} />
        <Chip label={`Pairs (moy. ${peerCount})`} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", fontWeight: 700 }} />
        <Chip label="Test scientifique" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: COLORS.green, fontWeight: 700 }} />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="end">
              <Box>
                <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>{dimensions.length}</Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                <Radar size={18} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="end">
              <Box>
                <Typography variant="body2" color="text.secondary">Pairs</Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>{peerCount}</Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                <UserRound size={18} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="end">
              <Box>
                <Typography variant="body2" color="text.secondary">Questionnaire</Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>
                  {matrix?.questionnaire_id ?? "–"}
                </Typography>
              </Box>
              <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                <Sparkles size={18} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {dimensions.length === 0 && !matrixLoading ? (
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Les résultats ne sont pas encore disponibles. Complétez les étapes précédentes de votre parcours pour accéder à vos scores.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {dimensions.map((dimension) => (
            <DimensionCard key={dimension.name} dimension={dimension} likertMax={matrix?.likert_max ?? 9} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
