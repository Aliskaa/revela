import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  Lock,
  MessageSquareQuote,
  Radar,
  Sparkles,
  Users,
  Brain,
} from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/journey")({
  component: ParticipantJourneyRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type JourneyStep = {
  label: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  state: "completed" | "current" | "locked";
};

const steps: JourneyStep[] = [
  {
    label: "Auto-évaluation",
    subtitle: "Notes de 1 à 9 sur les short labels",
    description:
      "Le participant note chaque short label de chaque dimension sur une échelle de 1 à 9.",
    icon: ClipboardList,
    state: "completed",
  },
  {
    label: "Feedback des pairs",
    subtitle: "Même logique de notation",
    description:
      "Les pairs renseignent les short labels sur une échelle de 1 à 9 pour compléter la lecture.",
    icon: Users,
    state: "current",
  },
  {
    label: "Test Élément Humain",
    subtitle: "2 × 54 questions",
    description:
      "Le test consiste à répondre à deux séries de 54 questions pour chaque questionnaire B, F et S.",
    icon: Brain,
    state: "locked",
  },
  {
    label: "Résultats",
    subtitle: "Lecture des écarts et synthèse",
    description:
      "Les résultats rassemblent les métriques, les écarts et les questions de restitution.",
    icon: Radar,
    state: "locked",
  },
  {
    label: "Restitution coaching",
    subtitle: "Temps d’échange avec le coach",
    description:
      "Le coach accompagne la mise en sens des résultats et prépare les prochaines questions utiles.",
    icon: MessageSquareQuote,
    state: "locked",
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

function StepCard({ step }: { step: JourneyStep }) {
  const Icon = step.icon;
  const chipLabel = step.state === "completed" ? "Terminé" : step.state === "current" ? "En cours" : "Verrouillé";
  const chipSx =
    step.state === "completed"
      ? { bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }
      : step.state === "current"
        ? { bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }
        : { bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" };

  return (
    <Box sx={{ border: `1px solid ${COLORS.border}`, borderRadius: 4, p: 2, bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1.5} alignItems="start">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 4,
            display: "grid",
            placeItems: "center",
            ...(step.state === "completed"
              ? { bgcolor: "rgba(16,185,129,0.10)", color: "rgb(4,120,87)" }
              : step.state === "current"
                ? { bgcolor: "rgba(255,204,0,0.14)", color: "rgb(180,120,0)" }
                : { bgcolor: "rgba(148,163,184,0.12)", color: "rgb(100,116,139)" }),
          }}
        >
          <Icon size={18} />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography fontWeight={700} color="text.primary">
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.subtitle}
              </Typography>
            </Box>
            <Chip label={chipLabel} size="small" sx={{ borderRadius: 99, ...chipSx }} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
            {step.description}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function RuleCard({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.3} alignItems="start">
          <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
            <Icon size={16} />
          </Box>
          <Box>
            <Typography fontWeight={700} color="text.primary">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.7 }}>
              {description}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantJourneyRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Parcours participant" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Mon parcours Révéla
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Cette page explique simplement le chemin du participant : auto-évaluation, feedback des pairs, test, résultats et restitution.
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ width: { xs: "100%", sm: 340 } }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
                    <Sparkles size={20} />
                  </Box>
                  <Box>
                    <Typography fontWeight={800} color="text.primary">
                      Révéla
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Un parcours en 5 étapes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        <RuleCard
          icon={ClipboardList}
          title="Auto-évaluation"
          description="Notation de 1 à 9 sur les short labels de chaque dimension."
        />
        <RuleCard
          icon={Users}
          title="Pairs"
          description="Même logique de notation, pour compléter la lecture du participant."
        />
        <RuleCard
          icon={Brain}
          title="Test Élément Humain"
          description="2 × 54 questions pour chaque questionnaire B, F et S."
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Les étapes du parcours" subtitle="Le participant avance dans cet ordre, avec des étapes verrouillées tant que les prérequis ne sont pas remplis." />
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              {steps.map((step) => (
                <StepCard key={step.label} step={step} />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2.5}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Ce que le participant voit" subtitle="Une vue simple et rassurante, sans surcharge métier." />
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.4}>
                <MiniLine icon={BadgeCheck} text="Ce qui est terminé est clairement affiché." />
                <MiniLine icon={Lock} text="Ce qui est verrouillé reste visible mais non accessible." />
                <MiniLine icon={ChevronRight} text="La prochaine action est toujours identifiable." />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Raccourci métier" subtitle="Le parcours alimente les pages dédiées sans les mélanger." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <QuickLink label="Auto-évaluation" />
                <QuickLink label="Feedback des pairs" />
                <QuickLink label="Test Élément Humain" />
                <QuickLink label="Résultats" />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle title="Rappel important" subtitle="Le parcours ne mélange pas les formulaires et la restitution." />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
            L’auto-évaluation et les feedbacks utilisent les short labels notés de 1 à 9. Le test Élément Humain repose sur deux séries de 54 questions pour chacun des questionnaires B, F et S. Les résultats sont ensuite préparés pour la lecture et le coaching.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}

function MiniLine({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="start">
      <Box sx={{ width: 34, height: 34, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon size={15} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pt: 0.2 }}>
        {text}
      </Typography>
    </Stack>
  );
}

function QuickLink({ label }: { label: string }) {
  return (
    <Button
      variant="outlined"
      endIcon={<ChevronRight size={16} />}
      sx={{
        justifyContent: "space-between",
        borderRadius: 4,
        borderColor: COLORS.border,
        color: "text.primary",
        textTransform: "none",
        py: 1.25,
      }}
    >
      {label}
    </Button>
  );
}
