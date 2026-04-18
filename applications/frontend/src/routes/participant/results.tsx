import * as React from "react";
import { useParticipantSession } from "@/hooks/participantSession";
import { useParticipantSessionMatrix } from "@/hooks/participantSession";
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
  border: "rgba(15,23,42,0.10)",
};

type MetricItem = {
  label: string;
  value: number | null;
  accent: "blue" | "yellow";
};

type DimensionView = {
  name: string;
  metrics: MetricItem[];
};

const buildDimensionsFromMatrix = (matrix: ParticipantQuestionnaireMatrix): DimensionView[] => {
  const dims: DimensionView[] = [];
  for (const rd of matrix.result_dims) {
    const metrics: MetricItem[] = [];
    for (let i = 0; i < rd.scores.length; i++) {
      const scoreKey = rd.scores[i];
      const row = matrix.rows.find(r => r.score_key === scoreKey);
      if (row) {
        metrics.push({
          label: row.label,
          value: row.self,
          accent: i % 2 === 0 ? "blue" : "yellow",
        });
      }
    }
    dims.push({ name: rd.name, metrics });
  }
  return dims;
};

function MiniValue({ item, likertMax }: { item: MetricItem; likertMax: number }) {
  const barColor = item.accent === "blue" ? COLORS.blue : COLORS.yellow;
  const pct = item.value != null ? Math.round((item.value / likertMax) * 100) : 0;

  return (
    <Card variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
      <Typography variant="h6" fontWeight={800} color="text.primary">{item.value ?? "–"}</Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ mt: 1.1, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: barColor } }}
      />
    </Card>
  );
}

function DimensionCard({ dimension, likertMax }: { dimension: DimensionView; likertMax: number }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={800} color="text.primary">{dimension.name}</Typography>
            <Chip label="Détail" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.2 }}>
            {dimension.metrics.map((item) => (
              <MiniValue key={item.label} item={item} likertMax={likertMax} />
            ))}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantResultsRoute() {
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const assignments = session?.assignments ?? [];

  // Auto-select the first active campaign on load
  React.useEffect(() => {
    if (assignments.length > 0) {
      const activeIdx = assignments.findIndex(a => a.campaign_status === "active");
      if (activeIdx >= 0) setSelectedIndex(activeIdx);
    }
  }, [assignments.length]);

  const selectedAssignment = assignments[selectedIndex] ?? assignments[0];

  const qid = selectedAssignment?.questionnaire_id ?? "";
  const campaignId = selectedAssignment?.campaign_id ?? undefined;

  const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);

  const isLoading = sessionLoading || matrixLoading;
  const coachName = selectedAssignment?.coach_name ?? "–";
  const campaignName = selectedAssignment?.campaign_name ?? "Résultats";

  const dimensions = React.useMemo(
    () => matrix ? buildDimensionsFromMatrix(matrix) : [],
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
              <Chip label="Résultats disponibles" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {campaignName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Cette page affiche une lecture de synthèse des écarts, avec plusieurs métriques par dimension.
              </Typography>
              {assignments.length > 1 && (
                <FormControl size="small" sx={{ mt: 2, minWidth: 300 }}>
                  <InputLabel>Campagne</InputLabel>
                  <Select
                    label="Campagne"
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(e.target.value as number)}
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
                    <Typography variant="caption" color="text.secondary">Dimensions</Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {dimensions.length} axe{dimensions.length !== 1 ? "s" : ""} suivi{dimensions.length !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="end">
              <Box>
                <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>{dimensions.length}</Typography>
                <Typography variant="caption" color="text.secondary">ICO suivies</Typography>
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
                <Typography variant="body2" color="text.secondary">Coaching</Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>
                  {selectedAssignment?.progression?.results_status === "completed" ? "Prêt" : "En attente"}
                </Typography>
                <Typography variant="caption" color="text.secondary">restitution</Typography>
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
                <Typography variant="caption" color="text.secondary">{matrix?.questionnaire_title ?? ""}</Typography>
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
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
              Métriques détaillées par dimension
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
              Chaque dimension affiche vos scores auto-évaluation.
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {dimensions.map((dimension) => (
                <DimensionCard key={dimension.name} dimension={dimension} likertMax={matrix?.likert_max ?? 9} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
