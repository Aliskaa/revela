import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Layers3,
  Lock,
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
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/participant/campaigns")({
  component: ParticipantCampaignsRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type CampaignStatus = "active" | "draft" | "closed";

type Campaign = {
  id: string;
  name: string;
  company: string;
  coach: string;
  questionnaire: string;
  status: CampaignStatus;
  progress: number;
  participants: string;
  lastUpdate: string;
  nextAction: string;
};

const campaigns: Campaign[] = [
  {
    id: "camp-2026-lyon",
    name: "Leadership DSJ 2026",
    company: "Ville de Lyon",
    coach: "Claire Martin",
    questionnaire: "B — Comportement",
    status: "active",
    progress: 58,
    participants: "1 participant principal · 5 pairs",
    lastUpdate: "Mise à jour il y a 2 jours",
    nextAction: "Inviter 2 pairs supplémentaires",
  },
  {
    id: "camp-2025-lyon",
    name: "Pilotage relationnel 2025",
    company: "Ville de Lyon",
    coach: "Claire Martin",
    questionnaire: "F — Ressentis",
    status: "closed",
    progress: 100,
    participants: "1 participant principal · 5 pairs",
    lastUpdate: "Campagne clôturée le 14/12/2025",
    nextAction: "Consulter les résultats archivés",
  },
  {
    id: "camp-2026-nord",
    name: "Transformation managériale",
    company: "Métropole du Nord",
    coach: "Julien Morel",
    questionnaire: "S — Soi",
    status: "draft",
    progress: 0,
    participants: "Participants importés, campagne non lancée",
    lastUpdate: "Brouillon enregistré hier",
    nextAction: "En attente du lancement par l’admin",
  },
];

const stats = [
  { label: "Campagnes rattachées", value: "3", icon: Layers3 },
  { label: "Campagnes actives", value: "1", icon: Gauge },
  { label: "Questionnaires complétés", value: "2", icon: CheckCircle2 },
  { label: "Feedbacks reçus", value: "3", icon: Users },
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

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="end">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.5, letterSpacing: -0.5 }}>
              {value}
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

function statusChip(status: CampaignStatus) {
  if (status === "active") {
    return <Chip label="En cours" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  }

  if (status === "closed") {
    return <Chip label="Terminée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
  }

  return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const isActive = campaign.status === "active";

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.3 }}>
                  {campaign.name}
                </Typography>
                {statusChip(campaign.status)}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                {campaign.company} · Coach {campaign.coach}
              </Typography>
            </Box>

            <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: isActive ? "rgba(15,24,152,0.08)" : "rgba(15,23,42,0.04)", color: isActive ? COLORS.blue : "rgb(100,116,139)", display: "grid", placeItems: "center", flex: "none" }}>
              <Sparkles size={18} />
            </Box>
          </Stack>

          <Divider />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: 2 }}>
            <Stack spacing={1.25}>
              <Row icon={ClipboardList} label="Questionnaire" value={campaign.questionnaire} />
              <Row icon={Users} label="Participants" value={campaign.participants} />
              <Row icon={CalendarDays} label="Dernière mise à jour" value={campaign.lastUpdate} />
            </Stack>

            <Card variant="outlined" sx={{ bgcolor: "rgba(15,23,42,0.03)", p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Progression
              </Typography>
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.3 }}>
                {campaign.progress}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                {campaign.nextAction}
              </Typography>
            </Card>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button
              variant="contained"
              disableElevation
              sx={{
                borderRadius: 3,
                bgcolor: COLORS.blue,
                textTransform: "none",
              }}
              endIcon={<ArrowRight size={16} />}
            >
              Ouvrir la campagne
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderRadius: 3,
                textTransform: "none",
              }}
            >
              Voir le suivi
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.3} alignItems="start">
      <Box sx={{ width: 36, height: 36, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon size={16} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function EmptyCampaignsState() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="start">
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)", display: "grid", placeItems: "center" }}>
            <Lock size={18} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="text.primary">
              Aucune campagne disponible pour le moment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
              Les campagnes apparaissent ici dès qu’elles sont créées et que ton accès est rattaché par l’administrateur.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ParticipantCampaignsRoute() {
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const completedCount = campaigns.filter((c) => c.status === "closed").length;

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5}>
            <SectionTitle
              title="Mes campagnes"
              subtitle="Toutes les campagnes auxquelles le participant est rattaché. Une campagne correspond à un questionnaire unique."
            />

            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher une campagne, un coach, une organisation…"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 520 }}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={2.5}>
          {campaigns.length > 0 ? campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />) : <EmptyCampaignsState />}
        </Stack>

        <Stack spacing={2.5}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Résumé rapide
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                Le participant peut consulter ici le périmètre de ses campagnes, puis entrer dans la campagne active pour reprendre le parcours.
              </Typography>

              <Stack spacing={1.4} sx={{ mt: 2 }}>
                <SummaryLine label="Campagnes actives" value={`${activeCount}`} />
                <SummaryLine label="Campagnes terminées" value={`${completedCount}`} />
                <SummaryLine label="Questionnaires différents" value="B / F / S" />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                Rappel produit
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                L’écran campagne doit rester simple : il aide à comprendre où en est le participant, sans charger la lecture métier du questionnaire.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} color="text.primary">
        {value}
      </Typography>
    </Stack>
  );
}
