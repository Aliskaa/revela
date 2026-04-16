import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  Mail,
  MessageSquareText,
  Plus,
  Sparkles,
  Target,
  UserRound,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export const Route = createFileRoute("/admin/campaigns/$campaignId")({
  component: AdminCampaignDetailRoute,
});

const COLORS = {
  blue: "rgb(15,24,152)",
  yellow: "rgb(255,204,0)",
  border: "rgba(15,23,42,0.10)",
};

type ParticipantRow = {
  name: string;
  email: string;
  status: "invited" | "in_progress" | "completed";
  responses: string;
};

type ResponseRow = {
  type: string;
  count: number;
  status: "waiting" | "active" | "complete";
};

const campaign = {
  id: "camp-2026-lyon",
  name: "Leadership DSJ 2026",
  company: "Ville de Lyon",
  coach: "Claire Martin",
  questionnaire: "B — Questionnaire B — Comportement",
  status: "Active",
  progress: 58,
  createdAt: "12 février 2026",
  updatedAt: "Il y a 2 jours",
  participants: 1,
  invitations: 5,
  collectedResponses: 3,
};

const participants: ParticipantRow[] = [
  {
    name: "Thomas Dubois",
    email: "thomas.dubois@ville-lyon.fr",
    status: "in_progress",
    responses: "3/5 pairs · auto terminée",
  },
  {
    name: "Marie Dupont",
    email: "marie.dupont@ville-lyon.fr",
    status: "completed",
    responses: "1/1 soumission",
  },
  {
    name: "Paul Martin",
    email: "paul.martin@ville-lyon.fr",
    status: "invited",
    responses: "En attente",
  },
];

const responses: ResponseRow[] = [
  { type: "Auto-évaluation", count: 1, status: "complete" },
  { type: "Feedback des pairs", count: 2, status: "active" },
  { type: "Test Élément Humain", count: 0, status: "waiting" },
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

function StatusChip({ status }: { status: string }) {
  if (status === "Active") return <Chip label="Active" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "Closed") return <Chip label="Clôturée" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(148,163,184,0.16)", color: "rgb(100,116,139)" }} />;
  return <Chip label="Brouillon" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function ParticipantStatusChip({ status }: { status: ParticipantRow["status"] }) {
  if (status === "completed") return <Chip label="Complété" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "in_progress") return <Chip label="En cours" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />;
  return <Chip label="Invité" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function ResponseStatusChip({ status }: { status: ResponseRow["status"] }) {
  if (status === "complete") return <Chip label="Complété" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(16,185,129,0.12)", color: "rgb(4,120,87)" }} />;
  if (status === "active") return <Chip label="En cours" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue }} />;
  return <Chip label="En attente" size="small" sx={{ borderRadius: 99, bgcolor: "rgba(255,204,0,0.16)", color: "rgb(180,120,0)" }} />;
}

function ParticipantRowView({ participant }: { participant: ParticipantRow }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={700} color="text.primary">
          {participant.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {participant.email}
        </Typography>
      </TableCell>
      <TableCell>
        <ParticipantStatusChip status={participant.status} />
      </TableCell>
      <TableCell>{participant.responses}</TableCell>
      <TableCell align="right">
        <Button variant="text" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none" }}>
          Ouvrir
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ResponseRowView({ response }: { response: ResponseRow }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 4, p: 1.8 }}>
      <Box>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {response.type}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {response.count} soumission(s)
        </Typography>
      </Box>
      <ResponseStatusChip status={response.status} />
    </Stack>
  );
}

function AdminCampaignDetailRoute() {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack spacing={2.5} direction={{ xs: "column", lg: "row" }} justifyContent="space-between" alignItems={{ xs: "start", lg: "start" }}>
            <Box>
              <Chip label="Détail campagne" sx={{ borderRadius: 99, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, mb: 1.5 }} />
              <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                {campaign.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 900 }}>
                Cockpit opérationnel de la campagne : questionnaire assigné, participants, invitations, réponses et pilotage.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button variant="contained" disableElevation startIcon={<Mail size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                Relancer les pairs
              </Button>
              <Button variant="outlined" startIcon={<Download size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                Exporter
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
        <StatCard label="Participants" value={String(campaign.participants)} helper="rattachés" icon={Users} />
        <StatCard label="Invitations" value={String(campaign.invitations)} helper="envoyées" icon={Mail} />
        <StatCard label="Réponses" value={String(campaign.collectedResponses)} helper="collectées" icon={MessageSquareText} />
        <StatCard label="Progression" value={`${campaign.progress}%`} helper="parcours global" icon={Target} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.25fr 0.75fr" }, gap: 3, alignItems: "start" }}>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Résumé opérationnel"
                subtitle="Les informations clés pour piloter rapidement la campagne."
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mt: 2 }}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Entreprise
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                    {campaign.company}
                  </Typography>
                </Card>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Coach
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                    {campaign.coach}
                  </Typography>
                </Card>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Questionnaire
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.4 }}>
                    {campaign.questionnaire}
                  </Typography>
                </Card>
              </Box>

              <Box sx={{ mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Progression
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={campaign.progress}
                  sx={{ mt: 1, height: 10, borderRadius: 99, bgcolor: "rgba(15,23,42,0.06)", "& .MuiLinearProgress-bar": { bgcolor: COLORS.blue } }}
                />
              </Box>

              <Stack direction="row" spacing={1.2} sx={{ mt: 2.5, flexWrap: "wrap" }}>
                <Chip icon={<CalendarDays size={14} />} label={`Créée le ${campaign.createdAt}`} sx={{ borderRadius: 99 }} />
                <Chip icon={<Clock3 size={14} />} label={`Maj ${campaign.updatedAt}`} sx={{ borderRadius: 99 }} />
                <StatusChip status={campaign.status} />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Participants de la campagne"
                subtitle="Vue opérationnelle des participants rattachés et de leur état de collecte."
                action={<Button variant="outlined" startIcon={<Plus size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>Ajouter</Button>}
              />

              <Box sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Participant</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Réponses</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.map((participant) => (
                      <ParticipantRowView key={participant.email} participant={participant} />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle
                title="Questionnaire et réponses"
                subtitle="Le questionnaire assigné et le volume de collecte associé."
              />

              <Stack spacing={1.3} sx={{ mt: 2 }}>
                {responses.map((response) => (
                  <ResponseRowView key={response.type} response={response} />
                ))}
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button variant="contained" disableElevation startIcon={<FileText size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                  Voir le détail des soumissions
                </Button>
                <Button variant="outlined" sx={{ borderRadius: 3, textTransform: "none" }}>
                  Ouvrir le catalogue
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Actions rapides" subtitle="Les actions fréquentes sur une campagne." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Button variant="contained" disableElevation startIcon={<Mail size={16} />} sx={{ borderRadius: 3, bgcolor: COLORS.blue, textTransform: "none" }}>
                  Relancer les pairs
                </Button>
                <Button variant="outlined" startIcon={<BadgeCheck size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                  Marquer comme terminée
                </Button>
                <Button variant="outlined" startIcon={<ArrowRight size={16} />} sx={{ borderRadius: 3, textTransform: "none" }}>
                  Aller au tableau de bord
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Pilotage" subtitle="Quelques repères utiles." />
              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <MiniLine label="Questionnaire" value={campaign.questionnaire} icon={ClipboardList} />
                <MiniLine label="Coach" value={campaign.coach} icon={UserRound} />
                <MiniLine label="Entreprise" value={campaign.company} icon={Sparkles} />
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
              <SectionTitle title="Notes" subtitle="Bloc réservé aux commentaires internes." />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                Cette campagne est structurée autour d’un seul questionnaire. La page détail doit rester le point de pilotage principal pour le suivi des invitations, des réponses et des exports.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Stack>
  );
}

function MiniLine({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="start">
      <Box sx={{ width: 36, height: 36, borderRadius: 3, bgcolor: "rgba(15,24,152,0.08)", color: COLORS.blue, display: "grid", placeItems: "center", flex: "none" }}>
        <Icon size={15} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}
