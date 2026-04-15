import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
  Users,
  UserRound,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type StatCard = {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
};

type CampaignRow = {
  name: string;
  company: string;
  coach: string;
  questionnaire: string;
  status: "active" | "draft" | "closed";
  progress: number;
  updatedAt: string;
};

const stats: StatCard[] = [
  {
    label: "Campagnes actives",
    value: "1",
    helper: "sur 2 campagnes",
    icon: Target,
  },
  {
    label: "Participants",
    value: "2",
    helper: "accès ouverts",
    icon: Users,
  },
  {
    label: "Entreprises",
    value: "1",
    helper: "client suivis",
    icon: Building2,
  },
  {
    label: "Coachs",
    value: "3",
    helper: "utilisateurs actifs",
    icon: UserRound,
  },
];

const campaigns: CampaignRow[] = [
  {
    name: "Leadership DSJ 2026",
    company: "Ville de Lyon",
    coach: "Claire Martin",
    questionnaire: "B — Comportement",
    status: "active",
    progress: 58,
    updatedAt: "Mise à jour il y a 2 jours",
  },
  {
    name: "Pilotage relationnel 2025",
    company: "Ville de Lyon",
    coach: "Claire Martin",
    questionnaire: "F — Ressentis",
    status: "closed",
    progress: 100,
    updatedAt: "Clôturée le 14/12/2025",
  },
  {
    name: "Transformation managériale",
    company: "Métropole du Nord",
    coach: "Julien Morel",
    questionnaire: "S — Soi",
    status: "draft",
    progress: 0,
    updatedAt: "Brouillon enregistré hier",
  },
];

const questionnaireSummary = [
  { code: "B", label: "Questionnaire B", count: "0 réponses", status: "En attente" },
  { code: "F", label: "Questionnaire F", count: "2 réponses", status: "En cours" },
  { code: "S", label: "Questionnaire S", count: "0 réponses", status: "En attente" },
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

function StatCard({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="end">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.4, letterSpacing: -0.5 }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.helper}
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

function StatusChip({ status }: { status: CampaignRow["status"] }) {
  if (status === "active") {
    return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  }
  if (status === "closed") {
    return <Chip label="Archivée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
  }
  return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function CampaignTableRow({ campaign }: { campaign: CampaignRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {campaign.name}
        </Typography>
      </TableCell>
      <TableCell>{campaign.company}</TableCell>
      <TableCell>{campaign.coach}</TableCell>
      <TableCell>{campaign.questionnaire}</TableCell>
      <TableCell>
        <StatusChip status={campaign.status} />
      </TableCell>
      <TableCell>
        <Box sx={{ minWidth: 140 }}>
          <Typography variant="body2" fontWeight={700} color="text.primary">
            {campaign.progress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={campaign.progress}
            sx={{ mt: 1, height: 8, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
          />
        </Box>
      </TableCell>
      <TableCell>{campaign.updatedAt}</TableCell>
      <TableCell align="right">
        <Button component={Link} to="/admin/campaigns" variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
          Ouvrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

function QuestionnaireCard({ item }: { item: { code: string; label: string; count: string; status: string } }) {
  const statusColor = item.status === "En cours" ? "rgba(16,185,129,0.12)" : "rgba(255,204,0,0.16)";
  const statusText = item.status === "En cours" ? "rgb(4,120,87)" : "rgb(180,120,0)";

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2 }}>
      <Box>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {item.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.count}
        </Typography>
      </Box>
      <Chip label={item.status} size="small" sx={{ borderRadius: 99, bgcolor: statusColor, color: statusText }} />
    </Stack>
  );
}

function QuickAction({ icon: Icon, title, subtitle, to }: { icon: React.ElementType; title: string; subtitle: string; to: string }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.2 }}>
        <Stack spacing={1.3}>
          <Stack direction="row" spacing={1.3} alignItems="start">
            <Box sx={{ width: 40, height: 40, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
              <Icon size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} color="text.primary">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.7 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Button component={Link} to={to} variant="outlined" sx={{ borderRadius: 3, textTransform: "none", width: "fit-content" }}>
            Ouvrir
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminDashboardRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Administration" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Bienvenue, Admin AOR !
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Le tableau de bord centralisé vous permet de visualiser rapidement l’état des campagnes, des participants, des coachs et des questionnaires.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="contained" disableElevation startIcon={<Plus size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                Nouvelle campagne
              </Button>
              <Button variant="outlined" startIcon={<FileText size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                Exporter
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr 0.65fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle
              title="Suivi des campagnes"
              subtitle="Vue rapide des campagnes et de leur progression opérationnelle."
              action={<Button component={Link} to="/admin/campaigns" variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>Voir toutes</Button>}
            />

            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Campagne</TableCell>
                    <TableCell>Entreprise</TableCell>
                    <TableCell>Coach</TableCell>
                    <TableCell>Questionnaire</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Progression</TableCell>
                    <TableCell>Mis à jour</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <CampaignTableRow key={campaign.name} campaign={campaign} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Questionnaires" subtitle="Répartition rapide des questionnaires actifs dans les campagnes." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                {questionnaireSummary.map((item) => (
                  <QuestionnaireCard key={item.code} item={item} />
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Accès rapides" subtitle="Les actions les plus fréquentes côté admin." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <QuickAction icon={ClipboardList} title="Créer une campagne" subtitle="Lancer un nouveau parcours avec un questionnaire assigné." to="/admin/campaigns" />
                <QuickAction icon={MessageSquareText} title="Consulter les réponses" subtitle="Voir les soumissions et les statuts de collecte." to="/admin/responses" />
                <QuickAction icon={Sparkles} title="Gérer les questionnaires" subtitle="Piloter le catalogue et les versions." to="/admin/questionnaires" />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle title="Synthèse opérationnelle" subtitle="Ce dashboard doit aider à décider vite." />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                À surveiller
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Les campagnes en brouillon
              </Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Suivi
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Les questionnaires actifs et les volumes reçus
              </Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Prochaine étape
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                Ouvrir la campagne détail
              </Typography>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
