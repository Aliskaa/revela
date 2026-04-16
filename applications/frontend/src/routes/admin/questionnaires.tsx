import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Edit3,
  Plus,
  Search,
  Sparkles,
  Users,
  Heart,
} from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/admin/questionnaires")({
  component: AdminQuestionnairesRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type QuestionnaireStatus = "active" | "draft" | "archived";

type QuestionnaireRow = {
  code: string;
  title: string;
  description: string;
  dimensions: string[];
  questionCount: number;
  status: QuestionnaireStatus;
  updatedAt: string;
};

const questionnaires: QuestionnaireRow[] = [
  {
    code: "B",
    title: "Questionnaire B — Comportement",
    description: "Lecture des comportements interpersonnels.",
    dimensions: ["Inclusion", "Contrôle", "Affection"],
    questionCount: 54,
    status: "active",
    updatedAt: "Mis à jour hier",
  },
  {
    code: "F",
    title: "Questionnaire F — Ressentis",
    description: "Lecture des ressentis et perceptions relationnelles.",
    dimensions: ["Importance", "Compétence", "Affection"],
    questionCount: 54,
    status: "active",
    updatedAt: "Mis à jour il y a 2 jours",
  },
  {
    code: "S",
    title: "Questionnaire S — Soi",
    description: "Lecture de la perception de soi et des ressources internes.",
    dimensions: ["Vitalité", "Libre arbitre", "Conscience", "Importance", "Compétence", "Amour de soi"],
    questionCount: 54,
    status: "draft",
    updatedAt: "Brouillon enregistré hier",
  },
];

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
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
      {action}
    </Stack>
  );
}

function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: React.ElementType }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 5, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="end">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.4, letterSpacing: -0.5 }}>
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

function StatusChip({ status }: { status: QuestionnaireStatus }) {
  if (status === "active") return <Chip label="Actif" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "draft") return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
  return <Chip label="Archivé" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
}

function QuestionnaireRowView({ questionnaire }: { questionnaire: QuestionnaireRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {questionnaire.code}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {questionnaire.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {questionnaire.description}
        </Typography>
      </TableCell>
      <TableCell>{questionnaire.dimensions.join(" · ")}</TableCell>
      <TableCell>{questionnaire.questionCount}</TableCell>
      <TableCell>
        <StatusChip status={questionnaire.status} />
      </TableCell>
      <TableCell>{questionnaire.updatedAt}</TableCell>
      <TableCell align="right">
        <Button variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
          Ouvrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

function QuestionnaireCard({ questionnaire }: { questionnaire: QuestionnaireRow }) {
  const icon = questionnaire.code === "B" ? Users : questionnaire.code === "F" ? Heart : Sparkles;
  const Icon = icon;

  return (
    <Card variant="outlined" sx={{ borderRadius: 5, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.8}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {questionnaire.code} · {questionnaire.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {questionnaire.description}
              </Typography>
            </Box>
            <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center" }}>
              <Icon size={16} />
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {questionnaire.dimensions.map((dimension) => (
              <Chip key={dimension} label={dimension} size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />
            ))}
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.2 }}>
            <MiniStat label="Questions" value={`${questionnaire.questionCount}`} />
            <MiniStat label="Maj" value={questionnaire.updatedAt} />
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" disableElevation component={Link} to="/admin/questionnaires" startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Ouvrir
            </Button>
            <Button variant="outlined" startIcon={<Edit3 size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
              Éditer
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
        {value}
      </Typography>
    </Box>
  );
}

function AdminQuestionnairesRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Questionnaires" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Questionnaires
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Référentiel des questionnaires Révéla, avec les dimensions, le volume de questions et l’état de publication.
              </Typography>
            </Box>

            <Button variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Nouveau questionnaire
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Questionnaires" value="3" helper="référencés" icon={ClipboardList} />
        <StatCard label="Actifs" value="2" helper="en production" icon={BadgeCheck} />
        <StatCard label="Brouillons" value="1" helper="à finaliser" icon={Sparkles} />
        <StatCard label="Dimensions" value="12" helper="au total" icon={Users} />
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle
            title="Liste des questionnaires"
            subtitle="Voir rapidement la structure et ouvrir le détail ou l’édition."
            action={<TextField size="small" placeholder="Rechercher un questionnaire…" sx={{ minWidth: 300 }} />}
          />

          <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Questionnaire</TableCell>
                  <TableCell>Dimensions</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Mis à jour</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {questionnaires.map((questionnaire) => (
                  <QuestionnaireRowView key={questionnaire.code} questionnaire={questionnaire} />
                ))}
              </TableBody>
            </Table>
          </Box>

          <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
            {questionnaires.map((questionnaire) => (
              <QuestionnaireCard key={questionnaire.code} questionnaire={questionnaire} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Pilotage" subtitle="Le catalogue doit rester simple à exploiter pour les campagnes." />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
              <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Production
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                  B et F en production
                </Typography>
              </Box>
              <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Travail en cours
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                  S en brouillon
                </Typography>
              </Box>
              <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Usage
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                  Assignation par campagne
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 6, borderColor: COLORS.border, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Accès rapides" subtitle="Les actions les plus utiles." />
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<Plus size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Créer un questionnaire
              </Button>
              <Button variant="outlined" startIcon={<Search size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Rechercher une version
              </Button>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les questionnaires actifs
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
