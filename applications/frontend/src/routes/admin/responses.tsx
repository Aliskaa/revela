import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Download,
  FileText,
  MessageSquareText,
  Search,
  Sparkles,
  Users,
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

export const Route = createFileRoute("/admin/responses")({
  component: AdminResponsesRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type ResponseStatus = "complete" | "active" | "waiting";

type ResponseRow = {
  type: string;
  campaign: string;
  company: string;
  participant: string;
  count: number;
  status: ResponseStatus;
  updatedAt: string;
};

const responses: ResponseRow[] = [
  {
    type: "Auto-évaluation",
    campaign: "Leadership DSJ 2026",
    company: "Ville de Lyon",
    participant: "Thomas Dubois",
    count: 1,
    status: "complete",
    updatedAt: "Il y a 2 jours",
  },
  {
    type: "Feedback des pairs",
    campaign: "Leadership DSJ 2026",
    company: "Ville de Lyon",
    participant: "Thomas Dubois",
    count: 2,
    status: "active",
    updatedAt: "Aujourd’hui",
  },
  {
    type: "Test Élément Humain",
    campaign: "Transformation managériale",
    company: "Métropole du Nord",
    participant: "Paul Martin",
    count: 0,
    status: "waiting",
    updatedAt: "En attente",
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
    <Card variant="outlined">
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

function StatusChip({ status }: { status: ResponseStatus }) {
  if (status === "complete") return <Chip label="Complété" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "active") return <Chip label="En cours" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />;
  return <Chip label="En attente" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function ResponseRowView({ response }: { response: ResponseRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {response.type}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {response.participant}
        </Typography>
      </TableCell>
      <TableCell>{response.campaign}</TableCell>
      <TableCell>{response.company}</TableCell>
      <TableCell>{response.count}</TableCell>
      <TableCell>
        <StatusChip status={response.status} />
      </TableCell>
      <TableCell>{response.updatedAt}</TableCell>
      <TableCell align="right">
        <Button variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
          Ouvrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ResponseCard({ response }: { response: ResponseRow }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={1.8}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {response.type}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {response.participant}
              </Typography>
            </Box>
            <StatusChip status={response.status} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.2 }}>
            <MiniStat label="Campagne" value={response.campaign} />
            <MiniStat label="Entreprise" value={response.company} />
            <MiniStat label="Réponses" value={String(response.count)} />
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" disableElevation startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
              Ouvrir
            </Button>
            <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
              Exporter
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

function AdminResponsesRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Réponses" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                Réponses
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                Suivi des soumissions collectées par campagne, avec accès rapide aux dossiers de collecte.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="contained" disableElevation startIcon={<Download size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                Exporter
              </Button>
              <Button variant="outlined" startIcon={<FileText size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                Détail
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Soumissions" value="3" helper="tous types confondus" icon={MessageSquareText} />
        <StatCard label="Complétées" value="1" helper="collecte validée" icon={BadgeCheck} />
        <StatCard label="En cours" value="1" helper="feedbacks pairs" icon={Sparkles} />
        <StatCard label="En attente" value="1" helper="test non démarré" icon={Users} />
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: 2.5 }}>
          <SectionTitle
            title="Liste des soumissions"
            subtitle="Chaque ligne correspond à un type de réponse relié à une campagne et à un participant."
            action={<TextField size="small" placeholder="Rechercher une soumission…" sx={{ minWidth: 300 }} />}
          />

          <Box sx={{ display: { xs: "none", lg: "block" }, overflowX: "auto" }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Campagne</TableCell>
                  <TableCell>Entreprise</TableCell>
                  <TableCell>Réponses</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Mis à jour</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.map((response) => (
                  <ResponseRowView key={`${response.type}-${response.campaign}`} response={response} />
                ))}
              </TableBody>
            </Table>
          </Box>

          <Stack spacing={2} sx={{ display: { xs: "flex", lg: "none" }, mt: 2 }}>
            {responses.map((response) => (
              <ResponseCard key={`${response.type}-${response.campaign}`} response={response} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 3, alignItems: "start" }}>
        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Accès rapides" subtitle="Les vues les plus utiles pour la collecte." />
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<ClipboardList size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les campagnes concernées
              </Button>
              <Button variant="outlined" startIcon={<Users size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les participants actifs
              </Button>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} sx={{ justifyContent: "space-between", borderRadius: 3, textTransform: "none" }}>
                Voir les questionnaires assignés
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <SectionTitle title="Lecture rapide" subtitle="La page doit aider à repérer ce qui bloque la collecte." />
            <Box sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Un admin doit pouvoir identifier immédiatement les réponses complétées, celles en cours, et les éléments encore attendus avant restitution.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
