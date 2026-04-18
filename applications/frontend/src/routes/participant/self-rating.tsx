import * as React from "react";
import { useParticipantSession, useParticipantSessionMatrix } from "@/hooks/participantSession";
import { useSelectedAssignment } from "@/hooks/useSelectedAssignment";
import { useSubmitParticipantQuestionnaire } from "@/hooks/questionnaires";
import type { ParticipantQuestionnaireMatrix } from "@aor/types";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  CheckCircle2,
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

export const Route = createFileRoute("/participant/self-rating")({
  component: ParticipantSelfRatingRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  border: "rgba(15,23,42,0.10)",
};

type ScoreItem = { scoreKey: number; label: string; };
type DimensionBlock = { dimension: string; items: ScoreItem[] };

const buildDimensionsFromMatrix = (matrix: ParticipantQuestionnaireMatrix): DimensionBlock[] => {
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

const initScoresFromMatrix = (matrix: ParticipantQuestionnaireMatrix): Record<string, number | null> => {
  const scores: Record<string, number | null> = {};
  for (const row of matrix.rows) {
    scores[String(row.score_key)] = row.self;
  }
  return scores;
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

function RatingScale({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      onChange={(_e, newVal) => { if (newVal !== null) onChange(newVal); }}
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
  onScoreChange: (scoreKey: string, value: number) => void;
}) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" fontWeight={800} color="text.primary">{block.dimension}</Typography>
            <Chip label="Auto-évaluation" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
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

function ParticipantSelfRatingRoute() {
  const navigate = useNavigate();
  const { data: session, isLoading: sessionLoading, isError } = useParticipantSession();

  const { assignment: activeAssignment } = useSelectedAssignment(session);
  const qid = activeAssignment?.questionnaire_id ?? "";
  const campaignId = activeAssignment?.campaign_id ?? undefined;

  const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(qid.length > 0, qid, campaignId);
  const submitMutation = useSubmitParticipantQuestionnaire(qid.toUpperCase(), campaignId);

  const [scores, setScores] = React.useState<Record<string, number | null>>({});
  const [initialized, setInitialized] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  React.useEffect(() => {
    if (matrix && !initialized) {
      setScores(initScoresFromMatrix(matrix));
      setInitialized(true);
    }
  }, [matrix, initialized]);

  const isLoading = sessionLoading || matrixLoading;
  const campaignActive = activeAssignment?.campaign_status === "active";
  const stepAvailable = activeAssignment?.progression?.self_rating_status === "pending"
    || activeAssignment?.progression?.self_rating_status === "completed"
    || !activeAssignment?.progression;
  const canSubmit = campaignActive && stepAvailable;
  const questionnaireTitle = matrix?.questionnaire_title ?? activeAssignment?.questionnaire_title ?? "Auto-évaluation";
  const questionnaireCode = matrix?.questionnaire_id ?? qid;

  const dimensions = React.useMemo(
    () => matrix ? buildDimensionsFromMatrix(matrix) : [],
    [matrix]
  );

  const totalItems = matrix?.rows.length ?? 0;
  const filledCount = Object.values(scores).filter(v => v !== null).length;
  const allFilled = totalItems > 0 && filledCount === totalItems;

  const handleScoreChange = (scoreKey: string, value: number) => {
    setScores(prev => ({ ...prev, [scoreKey]: value }));
  };

  const handleSubmit = async () => {
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(scores)) {
      if (v !== null) payload[k] = v;
    }
    await submitMutation.mutateAsync({ kind: "self_rating", scores: payload });
    setSuccessOpen(true);
  };

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary">Chargement de l'auto-évaluation</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (isError || !session) {
    return <Alert severity="error">Impossible de charger l'auto-évaluation pour le moment.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => {
          setSuccessOpen(false);
          navigate({ to: "/participant" });
        }}
        message="Auto-évaluation enregistrée"
      />

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Auto-évaluation" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {questionnaireTitle}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Notez chaque item de 1 à 9. Cette saisie sert de base à la lecture des écarts et à la restitution.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">{filledCount} / {totalItems}</Typography>
                    <Typography variant="body2" color="text.secondary">items complétés</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <InfoPill icon={ClipboardList} label="Questionnaire" value={questionnaireCode || "–"} />
        <InfoPill icon={BadgeCheck} label="Type" value="Auto-évaluation" />
        <InfoPill icon={Hash} label="Échelle" value="1 à 9" />
        <InfoPill icon={Users} label="Progression" value={`${filledCount} / ${totalItems}`} />
      </Box>

      {!canSubmit && (
        <Alert severity="warning">
          {!campaignActive
            ? "La campagne n'est pas active. L'auto-évaluation sera disponible une fois la campagne lancée par l'administrateur."
            : "Cette étape n'est pas encore accessible. Vérifiez l'état de votre parcours."}
        </Alert>
      )}

      {dimensions.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Aucun item disponible. Vérifiez que votre campagne est active et qu'un questionnaire est assigné.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>Saisie des short labels</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
              Chaque dimension est présentée en bloc. Sélectionnez une note pour chaque item.
            </Typography>
            <Divider sx={{ my: 2 }} />
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
                disabled={!canSubmit || filledCount === 0 || submitMutation.isPending}
                sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}
              >
                {submitMutation.isPending ? "Enregistrement…" : allFilled ? "Valider l'auto-évaluation" : `Enregistrer (${filledCount}/${totalItems})`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
