import * as React from "react";
import { useParticipantSession } from "@/hooks/participantSession";
import type { ParticipantSession } from "@aor/types";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Brain,
  Lock,
  MessageSquareQuote,
  Radar,
  UserRound,
  Users,
} from "lucide-react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/")({
  component: ParticipantDashboardRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type StepState = "completed" | "current" | "locked";

type JourneyStep = {
  label: string;
  state: StepState;
  description: string;
  icon: React.ElementType;
  to?: string;
};

type Metric = {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
};


const campaign = {
  name: "Leadership DSJ 2026",
  company: "Ville de Lyon",
  coach: "Claire Martin",
  questionnaire: "B — Comportement",
  status: "En cours",
  progress: 58,
  nextAction: "Inviter 2 pairs supplémentaires",
};

const journey: JourneyStep[] = [
  {
    label: "Auto-évaluation",
    state: "completed",
    description: "Vos réponses sont enregistrées pour la campagne en cours.",
    icon: BadgeCheck,
  },
  {
    label: "Feedback des pairs",
    state: "current",
    description: "Encore quelques réponses attendues avant de débloquer la suite.",
    icon: Users,
  },
  {
    label: "Test Élément Humain",
    state: "locked",
    description: "Accessible une fois les prérequis de la campagne complétés.",
    icon: Lock,
  },
  {
    label: "Résultats",
    state: "locked",
    description: "Les scores et écarts seront affichés après le test.",
    icon: Radar,
  },
  {
    label: "Restitution coaching",
    state: "locked",
    description: "Lecture partagée des résultats avec le coach.",
    icon: MessageSquareQuote,
  },
];

const metrics: Metric[] = [
  { label: "Progression", value: "58%", helper: "parcours complété", icon: Gauge },
  { label: "Auto-évaluation", value: "Terminé", helper: "prêt pour la suite", icon: ClipboardCheck },
  { label: "Feedback pairs", value: "3 / 5", helper: "réponses reçues", icon: Users },
  { label: "Questionnaire", value: campaign.questionnaire, helper: "lié à la campagne", icon: Brain },
];

type ParticipantAssignment = ParticipantSession["assignments"][number];

type CampaignView = typeof campaign & {
  questionnaireId: string | null;
  hasAssignment: boolean;
};

const statusLabels = {
  draft: "Brouillon",
  active: "En cours",
  closed: "Cloturee",
  archived: "Archivee",
} as const;

const stepStateFromStatus = (status?: "locked" | "pending" | "completed"): StepState => {
  if (status === "completed") {
    return "completed";
  }
  if (status === "pending") {
    return "current";
  }
  return "locked";
};

const completedStepValue = (status?: "locked" | "pending" | "completed") => (status === "completed" ? 1 : 0);

const buildProgress = (assignment?: ParticipantAssignment): number => {
  const progression = assignment?.progression;
  if (!progression) {
    return 0;
  }
  const completed =
    completedStepValue(progression.self_rating_status) +
    completedStepValue(progression.peer_feedback_status) +
    completedStepValue(progression.element_humain_status) +
    completedStepValue(progression.results_status);
  return Math.round((completed / 4) * 100);
};

const buildNextAction = (assignment?: ParticipantAssignment): string => {
  if (!assignment) {
    return "Aucune action requise pour le moment";
  }
  if (!assignment.invitation_confirmed) {
    return "Confirmer votre participation";
  }
  const progression = assignment.progression;
  if (!progression) {
    return assignment.allow_test_without_manual_inputs
      ? "Passer le test Element Humain"
      : "Demarrer votre parcours";
  }
  if (progression.self_rating_status !== "completed") {
    return "Completer votre auto-evaluation";
  }
  if (progression.peer_feedback_status !== "completed") {
    return "Finaliser le feedback des pairs";
  }
  if (progression.element_humain_status !== "completed") {
    return "Passer le test Element Humain";
  }
  if (progression.results_status !== "completed") {
    return "Consulter la publication des resultats";
  }
  return "Preparer la restitution coaching";
};

const buildCampaignView = (session?: ParticipantSession, assignment?: ParticipantAssignment): CampaignView => {
  if (!session || !assignment) {
    return {
      ...campaign,
      name: "Aucune campagne active",
      company: "Organisation non renseignee",
      coach: "Coach non attribue",
      questionnaire: "Aucun questionnaire assigne",
      questionnaireId: null,
      status: "A venir",
      progress: 0,
      nextAction: "Aucune action requise pour le moment",
      hasAssignment: false,
    };
  }
  return {
    name: assignment.campaign_name ?? "Campagne sans nom",
    company: assignment.company_name ?? "Organisation non renseignee",
    coach: assignment.coach_name ?? "Coach non attribue",
    questionnaire: assignment.questionnaire_title ?? assignment.questionnaire_id,
    questionnaireId: assignment.questionnaire_id,
    status: assignment.campaign_status ? statusLabels[assignment.campaign_status] : "Sans statut",
    progress: buildProgress(assignment),
    nextAction: buildNextAction(assignment),
    hasAssignment: true,
  };
};

const buildJourney = (assignment?: ParticipantAssignment): JourneyStep[] => {
  const qCode = assignment?.questionnaire_id?.toUpperCase() ?? "";
  const testRoute = qCode ? `/participant/test/${qCode}` : undefined;

  if (!assignment?.progression) {
    const manualInputState: StepState = assignment ? "current" : "locked";
    return [
      { ...journey[0], state: manualInputState, to: "/participant/self-rating" },
      { ...journey[1], state: manualInputState, to: "/participant/peer-feedback" },
      { ...journey[2], state: assignment?.allow_test_without_manual_inputs ? "current" : "locked", to: testRoute },
      { ...journey[3], state: "locked", to: "/participant/results" },
      { ...journey[4], state: "locked", to: "/participant/coach" },
    ];
  }
  return [
    { ...journey[0], state: stepStateFromStatus(assignment.progression.self_rating_status), to: "/participant/self-rating" },
    { ...journey[1], state: stepStateFromStatus(assignment.progression.peer_feedback_status), to: "/participant/peer-feedback" },
    { ...journey[2], state: stepStateFromStatus(assignment.progression.element_humain_status), to: testRoute },
    { ...journey[3], state: stepStateFromStatus(assignment.progression.results_status), to: "/participant/results" },
    { ...journey[4], state: assignment.progression.results_status === "completed" ? "current" : "locked", to: "/participant/coach" },
  ];
};

const buildMetrics = (campaignView: CampaignView, assignment?: ParticipantAssignment): Metric[] => [
  { ...metrics[0], value: `${campaignView.progress}%`, helper: "parcours complete" },
  {
    ...metrics[1],
    value: assignment?.progression?.self_rating_status === "completed" ? "Termine" : "A faire",
    helper: "premiere etape du parcours",
  },
  {
    ...metrics[2],
    value: assignment?.progression?.peer_feedback_status === "completed" ? "Termine" : "En attente",
    helper: "retours lies a la campagne",
  },
  { ...metrics[3], value: campaignView.questionnaire, helper: "lie a la campagne" },
];


function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}

function MetricCard({ metric, progress }: { metric: Metric; progress: number }) {
  const Icon = metric.icon;
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.4 }}>
        <Typography variant="body2" color="text.secondary">
          {metric.label}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mt: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" lineHeight={1.05} sx={{ letterSpacing: -0.5 }}>
              {metric.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {metric.helper}
            </Typography>
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
            <Icon size={18} />
          </Box>
        </Stack>
        {metric.label === "Progression" ? (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2.2, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function JourneyItem({ step }: { step: JourneyStep }) {
  const Icon = step.icon;
  const clickable = step.state !== "locked" && !!step.to;
  const chipLabel = step.state === "completed" ? "Terminé" : step.state === "current" ? "En cours" : "Verrouillé";
  const chipSx =
    step.state === "completed"
      ? { bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }
      : step.state === "current"
        ? { bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }
        : { bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" };

  const content = (
    <Stack
      spacing={1.2}
      sx={{
        p: 2,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        bgcolor: "#fff",
        cursor: clickable ? "pointer" : "default",
        opacity: step.state === "locked" ? 0.6 : 1,
        transition: "all 0.15s ease",
        ...(clickable ? { "&:hover": { borderColor: COLORS.blue, boxShadow: "0 2px 8px rgba(15,24,152,0.08)" } } : {}),
      }}
    >
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography fontWeight={600} color="text.primary">
              {step.label}
            </Typography>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Chip label={chipLabel} size="small" sx={{ borderRadius: 99, ...chipSx }} />
              {clickable && <ChevronRight size={16} style={{ color: COLORS.blue }} />}
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {step.description}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );

  if (clickable && step.to) {
    return <Link to={step.to} style={{ textDecoration: "none" }}>{content}</Link>;
  }
  return content;
}

function PageHeader({ campaignView, participantFirstName }: { campaignView: CampaignView; participantFirstName: string }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Chip label={campaignView.status} sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
            <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ letterSpacing: -0.5 }}>
              Bonjour {participantFirstName},
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
              Vous êtes dans l’espace participant de la campagne <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>{campaignView.name}</Box>. Le tableau de bord vous montre le contexte, la progression et la prochaine étape.
            </Typography>
          </Box>

          <Stack spacing={1.4} sx={{ width: { xs: "100%", sm: 320 } }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
                  <Users size={16} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Coach</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{campaignView.coach}</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", display: "grid", placeItems: "center" }}>
                  <Bell size={16} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Prochaine action</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{campaignView.nextAction}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaignView }: { campaignView: CampaignView }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Campagne active" subtitle="Contexte du parcours participant" />

        <Card variant="outlined" sx={{ bgcolor: COLORS.blue, color: "#fff", p: 2.2 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Campagne</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{campaignView.name}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.75 }}>{campaignView.company} · {campaignView.status}</Typography>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Progression</Typography>
          <LinearProgress variant="determinate" value={campaignView.progress} sx={{ height: 10, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }} />
        </Box>
      </CardContent>
    </Card>
  );
}


function CoachCard({ campaignView }: { campaignView: CampaignView }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Mon coach" subtitle="La personne qui accompagne la restitution" />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ borderRadius: 4, bgcolor: "rgba(15,23,42,0.03)", p: 2 }}>
          <Box sx={{ width: 54, height: 54, borderRadius: 4, bgcolor: COLORS.blue, color: "#fff", display: "grid", placeItems: "center" }}>
            <UserRound size={22} />
          </Box>
          <Box>
            <Typography fontWeight={700} color="text.primary">{campaignView.coach}</Typography>
            <Typography variant="body2" color="text.secondary">Coach référente Révéla</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <SectionTitle title="Actions rapides" subtitle="Les liens les plus utilisés" />
        <Stack spacing={1.2}>
          {[
            { label: "Inviter des pairs", icon: Users },
            { label: "Reprendre l’auto-évaluation", icon: ClipboardList },
            { label: "Consulter les résultats", icon: Radar },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.label}
                variant="outlined"
                fullWidth
                startIcon={<Icon size={16} />}
                endIcon={<ChevronRight size={16} />}
                sx={{ justifyContent: "space-between", borderRadius: 4, borderColor: COLORS.border, textTransform: "none", color: "text.primary", py: 1.3 }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ParticipantDashboardRoute() {
  const { data: session, isLoading, isError } = useParticipantSession();
  const activeAssignment = React.useMemo(
    () => session?.assignments.find(assignment => assignment.campaign_status === "active") ?? session?.assignments[0],
    [session]
  );
  const campaignView = React.useMemo(() => buildCampaignView(session, activeAssignment), [session, activeAssignment]);
  const journeyView = React.useMemo(() => buildJourney(activeAssignment), [activeAssignment]);
  const metricsView = React.useMemo(() => buildMetrics(campaignView, activeAssignment), [campaignView, activeAssignment]);
  const participantFirstName = session?.first_name?.trim() || "Participant";

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Chargement de votre espace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Recuperation de votre campagne, de votre progression et de vos prochaines actions.
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (isError || !session) {
    return <Alert severity="error">Impossible de charger votre espace participant pour le moment.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <PageHeader campaignView={campaignView} participantFirstName={participantFirstName} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        {metricsView.map((metric) => (
          <MetricCard key={metric.label} metric={metric} progress={campaignView.progress} />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.4fr 0.9fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Parcours Révéla" subtitle="Le flux reste lisible : terminé / en cours / verrouillé." />
              <Stack spacing={1.4}>
                {journeyView.map((step) => (
                  <JourneyItem key={step.label} step={step} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <CampaignCard campaignView={campaignView} />
        </Stack>

        <Stack spacing={3}>
          <CoachCard campaignView={campaignView} />
          <QuickActions />
        </Stack>
      </Box>
    </Stack>
  );
}
