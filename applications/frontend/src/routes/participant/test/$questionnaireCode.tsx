import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Brain,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock3,
  Hash,
  Heart,
  Save,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  Box,
  Button,
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

export const Route = createFileRoute("/participant/test/$questionnaireCode")({
  component: ParticipantTestSessionRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type QuestionnaireCode = "B" | "F" | "S";

type QuestionnaireMeta = {
  code: QuestionnaireCode;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  dimensions: string[];
  seriesLabels: [string, string];
  questionCountPerSeries: number;
};

const questionnaires: Record<QuestionnaireCode, QuestionnaireMeta> = {
  B: {
    code: "B",
    title: "Questionnaire B — Comportement",
    subtitle: "2 séries de 54 questions.",
    icon: Users,
    dimensions: ["Inclusion", "Contrôle", "Affection"],
    seriesLabels: ["Mon comportement actuel", "Mon comportement souhaité"],
    questionCountPerSeries: 54,
  },
  F: {
    code: "F",
    title: "Questionnaire F — Ressentis",
    subtitle: "2 séries de 54 questions.",
    icon: Heart,
    dimensions: ["Importance", "Compétence", "Affection"],
    seriesLabels: ["Mes ressentis actuels", "Mes ressentis désirés"],
    questionCountPerSeries: 54,
  },
  S: {
    code: "S",
    title: "Questionnaire S — Soi",
    subtitle: "2 séries de 54 questions.",
    icon: Sparkles,
    dimensions: ["Vitalité", "Libre arbitre", "Conscience", "Importance", "Compétence", "Amour de soi"],
    seriesLabels: ["Ma perception actuelle de moi", "Ma perception idéale de moi"],
    questionCountPerSeries: 54,
  },
};

function normalizeCode(value: string | undefined): QuestionnaireCode {
  if (value === "F" || value === "S") return value;
  return "B";
}

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

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
      <Stack direction="row" spacing={1.2} alignItems="start">
        <Box sx={{ width: 38, height: 38, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
          <Icon size={16} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function QuestionScale({ value, onChange }: { value: number | null; onChange: (n: number | null) => void }) {
  return (
    <ToggleButtonGroup value={value} exclusive onChange={(_, next) => onChange(next)} sx={{ flexWrap: "wrap", gap: 0.75 }}>
      {Array.from({ length: 9 }, (_, index) => {
        const n = index + 1;
        return (
          <ToggleButton
            key={n}
            value={n}
            sx={{
              minWidth: 38,
              height: 38,
              borderRadius: 2,
              borderColor: "rgba(15,23,42,0.12)",
              color: "text.primary",
              "&.Mui-selected": {
                bgcolor: COLORS.blue,
                color: "#fff",
              },
              "&.Mui-selected:hover": {
                bgcolor: "rgb(10,18,130)",
              },
            }}
          >
            {n}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

function QuestionCard({ questionnaireCode }: { questionnaireCode: QuestionnaireCode }) {
  const meta = questionnaires[questionnaireCode];
  const [seriesIndex, setSeriesIndex] = React.useState(0);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState<number | null>(null);

  const seriesCount = 2;
  const questionCount = meta.questionCountPerSeries;
  const totalQuestions = questionCount * seriesCount;
  const currentStep = seriesIndex * questionCount + questionIndex + 1;
  const progress = Math.round((currentStep / totalQuestions) * 100);

  const currentSeriesLabel = meta.seriesLabels[seriesIndex];
  const nextDisabled = seriesIndex === seriesCount - 1 && questionIndex === questionCount - 1;
  const prevDisabled = seriesIndex === 0 && questionIndex === 0;

  const goNext = () => {
    setAnswer(null);
    if (questionIndex < questionCount - 1) {
      setQuestionIndex((v) => v + 1);
      return;
    }
    if (seriesIndex < seriesCount - 1) {
      setSeriesIndex((v) => v + 1);
      setQuestionIndex(0);
    }
  };

  const goPrev = () => {
    setAnswer(null);
    if (questionIndex > 0) {
      setQuestionIndex((v) => v - 1);
      return;
    }
    if (seriesIndex > 0) {
      setSeriesIndex((v) => v - 1);
      setQuestionIndex(questionCount - 1);
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Série {seriesIndex + 1} / {seriesCount}
              </Typography>
              <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 0.35 }}>
                {currentSeriesLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Question {currentStep} / {totalQuestions}
              </Typography>
            </Box>
            <Chip label={`${progress}%`} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
          </Stack>

          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }} />

          <Box sx={{ borderRadius: 5, bgcolor: "rgba(15,23,42,0.03)", p: 2.2 }}>
            <Typography variant="caption" color="text.secondary">
              Question à brancher depuis le catalogue
            </Typography>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              {questionnaireCode === "B"
                ? "Je recherche activement la compagnie des gens."
                : questionnaireCode === "F"
                  ? "Je ressens chaque personne comme importante."
                  : "J’accorde toute mon attention à ce qui se passe."}
            </Typography>
          </Box>

          <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  Réponse de 1 à 9
                </Typography>
                <Chip label={answer ?? "—"} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />
              </Stack>
              <QuestionScale value={answer} onChange={setAnswer} />
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} disabled={prevDisabled} onClick={goPrev} sx={{ borderRadius: 3, textTransform: "none" }}>
              Précédent
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" disableElevation endIcon={<ArrowRight size={16} />} disabled={nextDisabled} onClick={goNext} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Suivant
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SidebarSummary({ questionnaireCode }: { questionnaireCode: QuestionnaireCode }) {
  const meta = questionnaires[questionnaireCode];
  return (
    <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Résumé" subtitle="Ce test est lié à la campagne et ne se choisit pas ici." />
        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.4}>
          <InfoPill icon={ClipboardList} label="Questionnaire" value={meta.code} />
          <InfoPill icon={CircleDot} label="Séries" value="2" />
          <InfoPill icon={Hash} label="Questions" value="54 par série" />
          <InfoPill icon={Clock3} label="Durée" value="Variable selon le rythme" />
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantTestSessionRoute() {
  const params = Route.useParams();
  const questionnaireCode = normalizeCode(params.questionnaireCode);
  const meta = questionnaires[questionnaireCode];
  const Icon = meta.icon;

  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Test Élément Humain" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {meta.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Le participant répond ici au questionnaire assigné par la campagne. Cette page est le flux de saisie, pas le choix du questionnaire.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ borderRadius: 4, borderColor: COLORS.border, width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Icon size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">
                      Questionnaire de la campagne
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {meta.code} · {meta.seriesLabels[0]}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <InfoPill icon={BadgeCheck} label="Questionnaire actif" value={meta.code} />
        <InfoPill icon={CircleDot} label="Séries" value="2" />
        <InfoPill icon={Hash} label="Questions" value="54 / série" />
        <InfoPill icon={Sparkles} label="Étape" value="Test" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={2.5}>
          <QuestionCard questionnaireCode={questionnaireCode} />

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Dimensions du questionnaire" subtitle="La structure dépend du questionnaire de la campagne." />
                <Stack spacing={1.2} sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(meta.dimensions.length, 3)}, minmax(0, 1fr))` }, gap: 1.2 }}>
                {meta.dimensions.map((dimension) => (
                  <Box key={dimension} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Dimension
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
                      {dimension}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={2.5}>
          <SidebarSummary questionnaireCode={questionnaireCode} />

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Rappel métier" subtitle="Les réponses sont enregistrées question par question." />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                L’auto-évaluation et les pairs restent sur les short labels en 1 à 9. Ici, l’utilisateur passe le questionnaire Élément Humain qui lui a été attribué par la campagne.
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Actions" subtitle="Sauvegarder la réponse ou revenir au flux." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Button variant="contained" disableElevation startIcon={<Save size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                  Enregistrer la réponse
                </Button>
                <Button variant="outlined" component={Link} to="/participant/test" sx={{ borderRadius: 3, textTransform: "none" }}>
                  Retour au questionnaire de campagne
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}
