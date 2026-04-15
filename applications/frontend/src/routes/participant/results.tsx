import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Radar,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
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
  value: number;
  accent: "blue" | "yellow";
};

type DimensionDetail = {
  label: string;
  note: string;
  metrics: MetricItem[];
};

type CoachingQuestion = {
  dimension: string;
  question: string;
  purpose: string;
};

const campaign = {
  name: "Leadership DSJ 2026",
  coach: "Claire Martin",
  status: "Résultats disponibles",
};

// Le catalogue du questionnaire B expose 4 scores par dimension :
// exprimé, souhaité, reçu, reçu souhaité.
const dimensions: DimensionDetail[] = [
  {
    label: "Inclusion",
    note: "Lecture des écarts entre comportement réel, besoin et perception du groupe.",
    metrics: [
      { label: "Exprimé", value: 7, accent: "blue" },
      { label: "Souhaité", value: 4, accent: "yellow" },
      { label: "Reçu", value: 6, accent: "blue" },
      { label: "Reçu souhaité", value: 5, accent: "yellow" },
    ],
  },
  {
    label: "Contrôle",
    note: "Profil globalement cohérent, sans tension majeure à ce stade.",
    metrics: [
      { label: "Exprimé", value: 5, accent: "blue" },
      { label: "Souhaité", value: 5, accent: "yellow" },
      { label: "Reçu", value: 5, accent: "blue" },
      { label: "Reçu souhaité", value: 5, accent: "yellow" },
    ],
  },
  {
    label: "Affection / Ouverture",
    note: "Zone utile pour ouvrir le questionnement de restitution.",
    metrics: [
      { label: "Exprimé", value: 8, accent: "blue" },
      { label: "Souhaité", value: 7, accent: "yellow" },
      { label: "Reçu", value: 7, accent: "blue" },
      { label: "Reçu souhaité", value: 6, accent: "yellow" },
    ],
  },
];

const coachingQuestions: CoachingQuestion[] = [
  {
    dimension: "Inclusion",
    question: "Qu’est-ce qui, aujourd’hui, me fait chercher plus ou moins de proximité avec les autres ?",
    purpose: "Ouvrir le questionnement sur le besoin réel derrière le comportement.",
  },
  {
    dimension: "Contrôle",
    question: "Dans quelles situations ai-je besoin de diriger, et dans lesquelles puis-je lâcher prise ?",
    purpose: "Explorer les zones de maîtrise et de délégation.",
  },
  {
    dimension: "Ouverture",
    question: "Qu’est-ce que je choisis de montrer, et qu’est-ce que je garde pour me protéger ?",
    purpose: "Identifier les mécanismes de protection ou d’exposition.",
  },
];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box>
      <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: React.ElementType }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 5, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="end">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
            <Icon size={18} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MiniValue({ item }: { item: MetricItem }) {
  const barColor = item.accent === "blue" ? COLORS.blue : COLORS.yellow;

  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {item.label}
      </Typography>
      <Typography variant="h6" fontWeight={800} color="text.primary">
        {item.value}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={item.value * 10}
        sx={{ mt: 1.1, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: barColor } }}
      />
    </Box>
  );
}

function DimensionCard({ dimension }: { dimension: DimensionDetail }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {dimension.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                {dimension.note}
              </Typography>
            </Box>
            <Chip label="Détail" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.2 }}>
            {dimension.metrics.map((item) => (
              <MiniValue key={item.label} item={item} />
            ))}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CoachingQuestionCard({ item }: { item: CoachingQuestion }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography fontWeight={700} color="text.primary">
          {item.dimension}
        </Typography>
        <Chip label="Question de restitution" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.7 }}>
        {item.question}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {item.purpose}
      </Typography>
    </Box>
  );
}

function CoachNote() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Lecture coach" subtitle="Une synthèse courte avant restitution" />

        <Stack spacing={2}>
          <Box sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.03)", p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              L’inclusion montre la tension la plus nette. Le reste du profil est plutôt stable, ce qui permet d’entrer dans une restitution ciblée et utile.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.2} sx={{ flexWrap: "wrap" }}>
            <Button variant="contained" disableElevation sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Préparer la séance
            </Button>
            <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
              Voir l’analyse complète
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantResultsRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
              <Box>
                <Chip label={campaign.status} sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                  Résultats de la campagne
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                  Cette page affiche une lecture de synthèse des écarts, avec plusieurs métriques par dimension et des questions de restitution.
                </Typography>
              </Box>

              <Stack spacing={1.2} sx={{ width: { xs: "100%", sm: 340 } }}>
                <Card variant="outlined" sx={{ borderRadius: 4, borderColor: COLORS.border }}>
                  <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                      <Users size={16} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Coach
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {campaign.coach}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 4, borderColor: COLORS.border }}>
                  <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", display: "grid", placeItems: "center" }}>
                      <Radar size={16} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dimensions
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        3 axes suivis
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="contained" disableElevation startIcon={<Download size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                Exporter PDF
              </Button>
              <Button variant="outlined" startIcon={<FileText size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                Voir le détail des réponses
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Dimensions" value="3" helper="ICO suivies" icon={Radar} />
        <StatCard label="Écart prioritaire" value="3" helper="sur inclusion" icon={TrendingUp} />
        <StatCard label="Coaching" value="Prêt" helper="restitution possible" icon={UserRound} />
        <StatCard label="Lecture" value="OK" helper="résultat exploitable" icon={Sparkles} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Métriques détaillées par dimension" subtitle="Chaque dimension affiche plusieurs métriques pour enrichir la lecture." />
              <Stack spacing={2}>
                {dimensions.map((dimension) => (
                  <DimensionCard key={dimension.label} dimension={dimension} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Questions de restitution" subtitle="Le coach s’appuie sur des questions ouvertes plutôt que sur une comparaison brute de sources." />
              <Stack spacing={1.4}>
                {coachingQuestions.map((item) => (
                  <CoachingQuestionCard key={item.dimension} item={item} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={2.5}>
          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Synthèse express" subtitle="Le coach peut s’appuyer dessus pour préparer la restitution." />
              <Box sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.03)", p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  L’inclusion est la tension la plus nette. Le contrôle reste aligné, tandis que l’ouverture appelle un questionnement plus relationnel.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <CoachNote />
        </Stack>
      </Box>
    </Stack>
  );
}
